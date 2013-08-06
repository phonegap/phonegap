/*
 * Copyright 2012 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <json/value.h>
#include <json/writer.h>
#include <stdio.h>
#include <webworks_utils.hpp>
#include <bb/cascades/pickers/ContactPicker>
#include <bb/cascades/pickers/ContactSelectionMode>
#include <QSet>
#include <QMap>
#include <QtAlgorithms>
#include <string>
#include <sstream>
#include <map>
#include <algorithm>
#include "pim_contacts_qt.hpp"

namespace webworks {

StringToKindMap PimContactsQt::_attributeKindMap;
StringToSubKindMap PimContactsQt::_attributeSubKindMap;
KindToStringMap PimContactsQt::_kindAttributeMap;
SubKindToStringMap PimContactsQt::_subKindAttributeMap;
QList<bbpim::SortSpecifier> PimContactsQt::_sortSpecs;
std::map<bbpim::ContactId, bbpim::Contact> PimContactsQt::_contactSearchMap;
ContactAccount& PimContactsQt::_contactAccount = ContactAccount::GetAccountInstance();

PimContactsQt::PimContactsQt()
{
    static bool mapInit = false;

    if (!mapInit) {
        createAttributeKindMap();
        createAttributeSubKindMap();
        createKindAttributeMap();
        createSubKindAttributeMap();
        mapInit = true;
    }
}

PimContactsQt::~PimContactsQt()
{
}

/****************************************************************
 * Public Functions
 ****************************************************************/

Json::Value PimContactsQt::Find(const Json::Value& args)
{
    Json::Value returnObj;

    if (!args.isMember("fields") || args["fields"].empty() || !args.isMember("options") || args["options"].isNull()) {
        returnObj["_success"] = false;
        returnObj["code"] = INVALID_ARGUMENT_ERROR;
        return returnObj;
    }

    QSet<bbpim::ContactId> results;
    int limit = -1;
    bool favorite = false;
    Json::Value includeAccounts = args["options"].get("includeAccounts", Json::nullValue);
    Json::Value excludeAccounts = args["options"].get("excludeAccounts", Json::nullValue);

    if (args["options"].isMember("favorite") && args["options"]["favorite"].isBool()) {
        favorite = args["options"]["favorite"].asBool();
    }

    if (args["options"].isMember("limit") && args["options"]["limit"].isInt()) {
        limit = args["options"]["limit"].asInt();
    }

    if (args["options"].isMember("filter") && !args["options"]["filter"].empty()) {
        results = getPartialSearchResults(args["options"]["filter"], args["fields"], favorite, includeAccounts, excludeAccounts);

        getSortSpecs(args["options"]["sort"]);

        returnObj["_success"] = true;
        returnObj["contacts"] = assembleSearchResults(results, args["fields"], limit);
    } else {
        // if no filters specified, use list filters to get all contacts
        bbpim::ContactService service;
        bbpim::ContactListFilters listFilters;
        QList<bbpim::Contact> results;
        Json::Value contacts;

        getSortSpecs(args["options"]["sort"]);
        if (!_sortSpecs.empty()) {
            listFilters.setSortBy(_sortSpecs);
        }

        listFilters.setIncludeAttributes(getIncludeAttributesList(args["fields"], &listFilters));

        if (favorite) {
            listFilters.setIsFavourite(favorite);
        }

        if (limit != -1) {
            listFilters.setLimit(limit);
        }

        getAccountFilters(NULL, &listFilters, includeAccounts, excludeAccounts);

        results = service.contacts(listFilters);
        for (QList<bbpim::Contact>::const_iterator i = results.constBegin(); i != results.constEnd(); i++) {
            Json::Value contactItem = populateContact(*i, args["fields"]);
            contacts.append(contactItem);
        }

        returnObj["_success"] = true;
        returnObj["contacts"] = contacts;
    }

    return returnObj;
}

Json::Value PimContactsQt::Save(const Json::Value& attributeObj)
{
    if (!attributeObj.isMember("id") || attributeObj["id"].isNull()) {
        return CreateContact(attributeObj);
    } else if (attributeObj.isMember("id") && attributeObj["id"].isInt()) {
        int contactId = attributeObj["id"].asInt();
        bbpim::ContactService service;

        if (contactId > 0) {
            bbpim::Contact contact = service.contactDetails(contactId);

            if (contact.isValid()) {
                return EditContact(contact, attributeObj);
            }
        } else {
            bbpim::Contact contact = service.contactDetails(contactId * -1);

            if (contact.isValid()) {
                return CloneContact(contact, attributeObj);
            }
        }
    }

    Json::Value returnObj;
    returnObj["_success"] = false;
    returnObj["code"] = INVALID_ARGUMENT_ERROR;
    return returnObj;
}

Json::Value PimContactsQt::CreateContact(const Json::Value& attributeObj)
{
    const Json::Value::Members attributeKeys = attributeObj.getMemberNames();
    Json::Value contactFields;

    bbpim::Contact newContact;
    bbpim::ContactBuilder contactBuilder(newContact.edit());

    for (unsigned int i = 0; i < attributeKeys.size(); i++) {
        const std::string key = attributeKeys[i];
        contactFields.append(Json::Value(key));
        addAttributeKind(contactBuilder, attributeObj[key], key);
    }

    bbpim::ContactService service;
    newContact = service.createContact(newContact, attributeObj["isWork"].asBool(), true);

    Json::Value returnObj;

    if (newContact.isValid()) {
        returnObj = populateContact(newContact, contactFields);
        returnObj["_success"] = true;
    } else {
        returnObj["_success"] = false;
        returnObj["code"] = UNKNOWN_ERROR;
    }

    return returnObj;
}

Json::Value PimContactsQt::DeleteContact(const Json::Value& contactObj)
{
    Json::Value returnObj;

    if (contactObj.isMember("contactId") && contactObj["contactId"].isInt()) {
        bbpim::ContactId contactId = contactObj["contactId"].asInt();

        bbpim::ContactService service;
        bbpim::Contact contact = service.contactDetails(contactId);

        if (contact.isValid()) {
            service.deleteContact(contactId);
            returnObj["_success"] = true;
            return returnObj;
        }
    }

    returnObj["_success"] = false;
    returnObj["code"] = INVALID_ARGUMENT_ERROR;
    return returnObj;
}

Json::Value PimContactsQt::EditContact(bbpim::Contact& contact, const Json::Value& attributeObj)
{
    bbpim::ContactBuilder contactBuilder(contact.edit());
    const Json::Value::Members attributeKeys = attributeObj.getMemberNames();
    Json::Value contactFields;

    for (unsigned int i = 0; i < attributeKeys.size(); i++) {
        const std::string key = attributeKeys[i];
        contactFields.append(Json::Value(key));
        syncAttributeKind(contact, attributeObj[key], key);
    }

    bbpim::ContactService service;
    contact = service.updateContact(contact);

    Json::Value returnObj;

    if (contact.isValid()) {
        returnObj = populateContact(contact, contactFields);
        returnObj["_success"] = true;
    } else {
        returnObj["_success"] = false;
        returnObj["code"] = UNKNOWN_ERROR;
    }

    return returnObj;
}

Json::Value PimContactsQt::CloneContact(bbpim::Contact& contact, const Json::Value& attributeObj)
{
    bbpim::ContactService service;
    bbpim::Contact newContact;
    bbpim::ContactBuilder contactBuilder(newContact.edit());
    contactBuilder = contactBuilder.addFromContact(contact);
    contactBuilder = contactBuilder.setFavorite(contact.isFavourite());

    const Json::Value::Members attributeKeys = attributeObj.getMemberNames();
    Json::Value contactFields;

    for (unsigned int i = 0; i < attributeKeys.size(); i++) {
        const std::string key = attributeKeys[i];
        contactFields.append(Json::Value(key));
        syncAttributeKind(newContact, attributeObj[key], key);
    }

    newContact = service.createContact(newContact, attributeObj["isWork"].asBool(), true);

    Json::Value returnObj;

    if (newContact.isValid()) {
        returnObj = populateContact(newContact, contactFields);
        returnObj["_success"] = true;
    } else {
        returnObj["_success"] = false;
        returnObj["code"] = UNKNOWN_ERROR;
    }

    return returnObj;
}

Json::Value PimContactsQt::GetContact(const Json::Value& args)
{
    Json::Value returnObj;
    Json::Value fields;
    bbpim::ContactService contactService;
    StringToKindMap::const_iterator it;
    int loop = 0;

    for (it = _attributeKindMap.begin(); it != _attributeKindMap.end(); ++it) {
        fields[loop] = it->first;
        loop++;
    }

    if (args.isMember("contactId")) {
        bbpim::Contact contact;
        bbpim::ContactId contactId = Utils::strToInt(args["contactId"].asString());

        if (contactId == -1) {
            returnObj["_success"] = false;
            returnObj["code"] = INVALID_ARGUMENT_ERROR;
        } else {
            contact = contactService.contactDetails(contactId);
            returnObj["_success"] = true;
            if (contact.isValid()) {
                returnObj["contact"] = populateContact(contact, fields);
            }
        }
    } else {
        returnObj["_success"] = false;
        returnObj["code"] = INVALID_ARGUMENT_ERROR;
    }

    if (returnObj.empty()) {
        returnObj["_success"] = false;
        returnObj["code"] = UNKNOWN_ERROR;
    }

    return returnObj;
}

Json::Value PimContactsQt::InvokePicker(const Json::Value& args)
{
    bb::cascades::pickers::ContactPicker picker;
    bb::cascades::pickers::ContactSelectionMode::Type mode;
    QSet<bbpim::AttributeKind::Type> filters;
    Json::Value result;

    if (args.isMember("mode")) {
        switch (args["mode"].asInt()) {
            case bb::cascades::pickers::ContactSelectionMode::Single:
                mode = bb::cascades::pickers::ContactSelectionMode::Single;
                break;
            case bb::cascades::pickers::ContactSelectionMode::Multiple:
                mode = bb::cascades::pickers::ContactSelectionMode::Multiple;
                break;
            case bb::cascades::pickers::ContactSelectionMode::Attribute:
                mode = bb::cascades::pickers::ContactSelectionMode::Attribute;
                break;
            default:
                result["_success"] = false;
                result["code"] = INVALID_ARGUMENT_ERROR;
                return result;
        }

        picker.setMode(mode);

        if (args.isMember("fields") && !args["fields"].empty()) {
            std::string fieldName;
            StringToKindMap::iterator found;

            if (_attributeKindMap.empty()) {
                createAttributeKindMap();
            }

            for (unsigned int i = 0; i < args["fields"].size(); i++) {
                fieldName = args["fields"][i].asString();

                if ((found = _attributeKindMap.find(fieldName)) != _attributeKindMap.end()) {
                    filters << found->second;
                }
            }

            picker.setKindFilters(filters);
        }

        // cannot open picker if mode = attribute unless filters are specified
        if (mode == bb::cascades::pickers::ContactSelectionMode::Attribute && filters.empty()) {
            result["_success"] = false;
            result["code"] = INVALID_ARGUMENT_ERROR;
            return result;
        }

        if (args.isMember("title") && args["title"].isString()) {
            picker.setTitle(QString(args["title"].asCString()));
        }

        if (args.isMember("confirmButtonLabel") && args["confirmButtonLabel"].isString()) {
            picker.setConfirmButtonLabel(QString(args["confirmButtonLabel"].asCString()));
        }

        picker.open();

        result["_success"] = true;
        return result;
    }

    result["_success"] = false;
    result["code"] = INVALID_ARGUMENT_ERROR;
    return result;
}

Json::Value PimContactsQt::GetContactAccounts()
{
    Json::Value retVal;

    retVal["accounts"] = Json::Value();
    QList<bb::pim::account::Account> accounts = _contactAccount.GetContactAccounts();
    for (int i = 0; i < accounts.size(); ++i) {
        retVal["accounts"].append(ContactAccount::Account2Json(accounts[i]));
    }
    retVal["_success"] = true;
    return retVal;
}

/****************************************************************
 * Helper functions for Find
 ****************************************************************/

QList<bbpim::SearchField::Type> PimContactsQt::getSearchFields(const Json::Value& searchFieldsJson)
{
    QList<bbpim::SearchField::Type> searchFields;

    switch (searchFieldsJson["fieldName"].asInt()) {
        case bbpim::SearchField::FirstName:
            searchFields.append(bbpim::SearchField::FirstName);
            break;
        case bbpim::SearchField::LastName:
            searchFields.append(bbpim::SearchField::LastName);
            break;
        case bbpim::SearchField::CompanyName:
            searchFields.append(bbpim::SearchField::CompanyName);
            break;
        case bbpim::SearchField::Phone:
            searchFields.append(bbpim::SearchField::Phone);
            break;
        case bbpim::SearchField::Email:
            searchFields.append(bbpim::SearchField::Email);
            break;
        case bbpim::SearchField::BBMPin:
            searchFields.append(bbpim::SearchField::BBMPin);
            break;
        case bbpim::SearchField::LinkedIn:
            searchFields.append(bbpim::SearchField::LinkedIn);
            break;
        case bbpim::SearchField::Twitter:
            searchFields.append(bbpim::SearchField::Twitter);
            break;
        case bbpim::SearchField::VideoChat:
            searchFields.append(bbpim::SearchField::VideoChat);
            break;
    }

    return searchFields;
}

void PimContactsQt::getSortSpecs(const Json::Value& sort)
{
    _sortSpecs.clear();

    if (sort.isArray()) {
        for (unsigned int j = 0; j < sort.size(); j++) {
            bbpim::SortOrder::Type order;
            bbpim::SortColumn::Type sortField = bbpim::SortColumn::LastName;

            if (sort[j]["desc"].asBool()) {
                order = bbpim::SortOrder::Descending;
            } else {
                order = bbpim::SortOrder::Ascending;
            }

            switch (sort[j]["fieldName"].asInt()) {
                case bbpim::SortColumn::FirstName:
                    sortField = bbpim::SortColumn::FirstName;
                    break;
                case bbpim::SortColumn::LastName:
                    sortField = bbpim::SortColumn::LastName;
                    break;
                case bbpim::SortColumn::CompanyName:
                    sortField = bbpim::SortColumn::CompanyName;
                    break;
            }

            _sortSpecs.append(bbpim::SortSpecifier(sortField, order));
        }
    }
}

QSet<bbpim::ContactId> PimContactsQt::getPartialSearchResults(const Json::Value& filter, const Json::Value& contactFields, const bool favorite, const Json::Value& includeAccounts, const Json::Value& excludeAccounts)
{
    QSet<bbpim::ContactId> results;

    _contactSearchMap.clear();

    if (!filter.empty()) {
        for (unsigned int j = 0; j < filter.size(); j++) {
            QSet<bbpim::ContactId> currentResults = singleFieldSearch(filter[j], contactFields, favorite, includeAccounts, excludeAccounts);

            if (currentResults.empty()) {
                // no need to continue, can return right away
                results = currentResults;
                break;
            } else {
                if (j == 0) {
                    results = currentResults;
                } else {
                    results.intersect(currentResults);
                }
            }
        }
    }

    return results;
}

void PimContactsQt::getAccountFilters(bbpim::ContactSearchFilters* searchFilter, bbpim::ContactListFilters* listFilter, const Json::Value& includeAccounts, const Json::Value& excludeAccounts)
{
    if (!includeAccounts.empty() && includeAccounts.isArray()) {
        QList<bbpim::AccountId> accountIds;

        for (unsigned int i = 0; i < includeAccounts.size(); i++) {
            accountIds << Utils::strToInt(includeAccounts[i].asString());
        }

        if (searchFilter != NULL) {
            searchFilter->setHasAccounts(accountIds);
        }

        if (listFilter != NULL) {
            listFilter->setHasAccounts(accountIds);
        }
    }

    if (!excludeAccounts.empty() && excludeAccounts.isArray()) {
        QList<bbpim::AccountId> accountIds;

        for (unsigned int i = 0; i < excludeAccounts.size(); i++) {
            accountIds << Utils::strToInt(excludeAccounts[i].asString());
        }

        if (searchFilter != NULL) {
            searchFilter->setExcludeAccounts(accountIds);
        }

        if (listFilter != NULL) {
            listFilter->setExcludeAccounts(accountIds);
        }
    }
}

QList<bbpim::AttributeKind::Type> PimContactsQt::getIncludeAttributesList(const Json::Value& contactFields, bbpim::ContactListFilters* listFilters)
{
    QList<bbpim::AttributeKind::Type> includeFields;

    for (unsigned int i = 0; i < contactFields.size(); i++) {
        // favorite is always included, no need to include
        if (contactFields[i].asString() == "favorite") {
            continue;
        }

        StringToKindMap::const_iterator kindIter = _attributeKindMap.find(contactFields[i].asString());

        if (kindIter != _attributeKindMap.end()) {
            // multiple fields can map to the same kind, only add kind to the list if it's not already added
            if (includeFields.count(kindIter->second) == 0) {
                includeFields.append(kindIter->second);
            }
        } else if (contactFields[i].asString() == "displayName" || contactFields[i].asString() == "nickname") {
            // special case: displayName and nickname are first-level fields under Contact but only map to AttributeSubKind
            if (includeFields.count(bbpim::AttributeKind::Name) == 0) {
                includeFields.append(bbpim::AttributeKind::Name);
            }
        } else if (contactFields[i].asString() == "addresses") {
            if (listFilters != NULL) {
                listFilters->setIncludePostalAddress(true);
            }
        } else if (contactFields[i].asString() == "photos") {
            if (listFilters != NULL) {
                listFilters->setIncludePhotos(true);
            }
        }
    }

    return includeFields;
}

QSet<bbpim::ContactId> PimContactsQt::singleFieldSearch(const Json::Value& searchFieldsJson, const Json::Value& contactFields, const bool favorite, const Json::Value& includeAccounts, const Json::Value& excludeAccounts)
{
    QList<bbpim::SearchField::Type> searchFields = PimContactsQt::getSearchFields(searchFieldsJson);
    QSet<bbpim::ContactId> contactIds;

    if (!searchFields.empty()) {
        bbpim::ContactService contactService;
        bbpim::ContactSearchFilters contactFilter;
        QList<bbpim::Contact> results;

        contactFilter.setSearchFields(searchFields);
        contactFilter.setSearchValue(QString(searchFieldsJson["fieldValue"].asString().c_str()));

        if (favorite) {
            contactFilter.setIsFavourite(favorite);
        }

        contactFilter.setShowAttributes(true);
        contactFilter.setIncludeAttributes(getIncludeAttributesList(contactFields));

        getAccountFilters(&contactFilter, NULL, includeAccounts, excludeAccounts);

        results = contactService.searchContacts(contactFilter);

        for (int i = 0; i < results.size(); i++) {
            contactIds.insert(results[i].id());
            _contactSearchMap[results[i].id()] = results[i];
        }
    }

    return contactIds;
}

QString PimContactsQt::getSortFieldValue(const bbpim::SortColumn::Type sort_field, const bbpim::Contact& contact)
{
    switch (sort_field) {
        case bbpim::SortColumn::FirstName:
            return contact.sortFirstName();
        case bbpim::SortColumn::LastName:
            return contact.sortLastName();
        case bbpim::SortColumn::CompanyName:
            return contact.sortCompanyName();
    }

    return QString();
}

bool PimContactsQt::lessThan(const bbpim::Contact& c1, const bbpim::Contact& c2)
{
    QList<bbpim::SortSpecifier>::const_iterator i = PimContactsQt::_sortSpecs.constBegin();
    bbpim::SortSpecifier sortSpec;
    QString val1, val2;

    do {
        sortSpec = *i;
        val1 = PimContactsQt::getSortFieldValue(sortSpec.first, c1);
        val2 = PimContactsQt::getSortFieldValue(sortSpec.first, c2);
        ++i;
    } while (val1 == val2 && i != PimContactsQt::_sortSpecs.constEnd());

    if (sortSpec.second == bbpim::SortOrder::Ascending) {
        return val1 < val2;
    } else {
        return !(val1 < val2);
    }
}

Json::Value PimContactsQt::assembleSearchResults(const QSet<bbpim::ContactId>& resultIds, const Json::Value& contactFields, int limit)
{
    QMap<bbpim::ContactId, bbpim::Contact> completeResults;

    // put complete contacts in map
    for (QSet<bbpim::ContactId>::const_iterator i = resultIds.constBegin(); i != resultIds.constEnd(); i++) {
        completeResults.insertMulti(*i, _contactSearchMap[*i]);
    }

    // sort results based on sort specs
    QList<bbpim::Contact> sortedResults = completeResults.values();
    if (!_sortSpecs.empty()) {
        qSort(sortedResults.begin(), sortedResults.end(), lessThan);
    }

    Json::Value contactArray;

    // if limit is -1, returned all available results, otherwise return based on the number passed in find options
    if (limit == -1) {
        limit = sortedResults.size();
    } else {
        limit = std::min(limit, sortedResults.size());
    }

    for (int i = 0; i < limit; i++) {
        Json::Value contactItem = populateContact(sortedResults[i], contactFields);
        contactArray.append(contactItem);
    }

    return contactArray;
}

std::string PimContactsQt::replaceAll(const std::string& s, const std::string& souce, const std::string& target) {
    size_t start = 0;
    std::string temp(s);
    while ((start = temp.find(souce, start)) != std::string::npos) {
        temp.replace(start, souce.length(), target);
        start += target.length();
    }
    return temp;
}
std::string PimContactsQt::replaceString(const std::string& s) {
    std::string temp = replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(s), "\n", "\\\\n"), "\r", ""), "\t", "\\\\t"), "\"", "\"");
    return temp;
}

/****************************************************************
 * Helper functions shared by Find and Save
 ****************************************************************/

Json::Value PimContactsQt::populateContact(const bbpim::Contact& contact, const Json::Value& contactFields)
{
    Json::Value contactItem;

    for (unsigned int i = 0; i < contactFields.size(); i++) {
        std::string field = contactFields[i].asString();
        StringToKindMap::const_iterator kindIter = _attributeKindMap.find(field);

        if (kindIter != _attributeKindMap.end()) {
            switch (kindIter->second) {
                case bbpim::AttributeKind::Name: {
                    contactItem[field] = Json::Value();
                    populateField(contact, kindIter->second, contactItem[field], false, false);
                    break;
                }

                case bbpim::AttributeKind::OrganizationAffiliation: {
                    contactItem[field] = Json::Value();
                    populateOrganizations(contact, contactItem[field]);
                    break;
                }

                case bbpim::AttributeKind::Date:
                case bbpim::AttributeKind::Note:
                case bbpim::AttributeKind::Sound: {
                    populateField(contact, kindIter->second, contactItem, false, false);
                    break;
                }

                case bbpim::AttributeKind::VideoChat: {
                    contactItem[field] = Json::Value();
                    populateField(contact, kindIter->second, contactItem[field], false, true);
                    break;
                }

                case bbpim::AttributeKind::Email:
                case bbpim::AttributeKind::Fax:
                case bbpim::AttributeKind::Pager:
                case bbpim::AttributeKind::Phone:
                case bbpim::AttributeKind::Profile:
                case bbpim::AttributeKind::Website:
                case bbpim::AttributeKind::InstantMessaging: {
                    contactItem[field] = Json::Value();
                    populateField(contact, kindIter->second, contactItem[field], true, false);
                    break;
                }

                // Special cases (treated differently in ContactBuilder):
                default: {
                    if (field == "addresses") {
                        contactItem[field] = Json::Value();
                        populateAddresses(contact, contactItem[field]);
                    } else if (field == "photos") {
                        contactItem[field] = Json::Value();
                        populatePhotos(contact, contactItem[field]);
                    } else if (field == "news") {
                        contactItem[field] = Json::Value();
                        populateNews(contact, contactItem[field]);
                    } else if (field == "activities") {
                        contactItem[field] = Json::Value();
                        populateActivity(contact, contactItem[field]);
                    }

                    break;
                }
            }
        } else {
            if (field == "displayName" || field == "nickname") {
                populateDisplayNameNickName(contact, contactItem, field);
            }
        }
    }

    contactItem["sourceAccounts"] = Json::Value();
    // fetch sourceAccounts by sourceSourceIds
    for (int i = 0; i < contact.sourceAccountIds().size(); ++i) {
        bb::pim::account::AccountKey id = contact.sourceAccountIds()[i];
        bb::pim::account::Account account = _contactAccount.GetAccount(id);
        contactItem["sourceAccounts"].append(ContactAccount::Account2Json(account));
    }

    contactItem["id"] = Utils::intToStr(contact.id());
    contactItem["favorite"] = Json::Value(contact.isFavourite()); // always populate favorite

    return contactItem;
}

void PimContactsQt::populateField(const bbpim::Contact& contact, bbpim::AttributeKind::Type kind, Json::Value& contactItem, bool isContactField, bool isArray)
{
    QList<bbpim::ContactAttribute> attrs = contact.filteredAttributes(kind);

    for (int i = 0; i < attrs.size(); i++) {
        bbpim::ContactAttribute currentAttr = attrs[i];

        // displayName and nickname are populated separately, do not populate within the name object
        if (currentAttr.subKind() == bbpim::AttributeSubKind::NameDisplayName || currentAttr.subKind() == bbpim::AttributeSubKind::NameNickname) {
            continue;
        }

        Json::Value val;
        SubKindToStringMap::const_iterator typeIter = _subKindAttributeMap.find(currentAttr.subKind());

        if (typeIter != _subKindAttributeMap.end()) {
            if (isContactField) {
                val["type"] = Json::Value(typeIter->second);

                std::string value = currentAttr.value().toStdString();
                value = replaceString(value);

                val["value"] = Json::Value(value);
                contactItem.append(val);
            } else {
                if (isArray) {
                    std::string value = currentAttr.value().toStdString();
                    value = replaceString(value);

                    val = Json::Value(value);
                    contactItem.append(val);
                } else {
                    if (kind == bbpim::AttributeKind::Date) {
                        QString format = "yyyy-MM-dd";
                        contactItem[typeIter->second] = Json::Value(currentAttr.valueAsDateTime().date().toString(format).toStdString());
                    } else {
                        std::string value = currentAttr.value().toStdString();
                        value = replaceString(value);
                        contactItem[typeIter->second] = Json::Value(value);
                    }
                }
            }
        } else if (kind == bbpim::AttributeKind::Note) {
            std::string note = currentAttr.value().toStdString();
            note = replaceString(note);
            contactItem["note"] = Json::Value(note);
            break;
        }
    }
}

void PimContactsQt::populateDisplayNameNickName(const bbpim::Contact& contact, Json::Value& contactItem, const std::string& field)
{
    QList<QList<bbpim::ContactAttribute> > nameGroups = contact.filteredAttributesByGroupKey(bbpim::AttributeKind::Name);
    bbpim::AttributeSubKind::Type subkind = (field == "displayName" ? bbpim::AttributeSubKind::NameDisplayName : bbpim::AttributeSubKind::NameNickname);

    if (!nameGroups.empty()) {
        QList<bbpim::ContactAttribute> nameAttrs = nameGroups[0];

        for (int i = 0; i < nameAttrs.size(); i++) {
            bbpim::ContactAttribute currentAttr = nameAttrs[i];

            if (currentAttr.subKind() == subkind) {
                std::string value = currentAttr.value().toStdString();
                value = replaceString(value);
                contactItem[field] = Json::Value(value);
                break;
            }
        }
    }
}

void PimContactsQt::populateAddresses(const bbpim::Contact& contact, Json::Value& contactAddrs)
{
    bbpim::ContactService contactService;
    bbpim::Contact fullContact = contactService.contactDetails(contact.id());
    QList<bbpim::ContactPostalAddress> addrs = fullContact.postalAddresses();

    for (int i = 0; i < addrs.size(); i++) {
        bbpim::ContactPostalAddress currentAddr = addrs[i];
        Json::Value addr;

        SubKindToStringMap::const_iterator typeIter = _subKindAttributeMap.find(currentAddr.subKind());

        if (typeIter != _subKindAttributeMap.end()) {
            addr["type"] = Json::Value(typeIter->second);
        }

        addr["streetAddress"] = Json::Value(currentAddr.line1().toStdString());
        addr["streetOther"] = Json::Value(currentAddr.line2().toStdString());
        addr["country"] = Json::Value(currentAddr.country().toStdString());
        addr["locality"] = Json::Value(currentAddr.city().toStdString());
        addr["postalCode"] = Json::Value(currentAddr.postalCode().toStdString());
        addr["region"] = Json::Value(currentAddr.region().toStdString());

        contactAddrs.append(addr);
    }
}

void PimContactsQt::populateOrganizations(const bbpim::Contact& contact, Json::Value& contactOrgs)
{
    QList<QList<bbpim::ContactAttribute> > orgAttrs = contact.filteredAttributesByGroupKey(bbpim::AttributeKind::OrganizationAffiliation);

    for (int i = 0; i < orgAttrs.size(); i++) {
        QList<bbpim::ContactAttribute> currentOrgAttrs = orgAttrs[i];
        Json::Value org;

        for (int j = 0; j < currentOrgAttrs.size(); j++) {
            bbpim::ContactAttribute attr = currentOrgAttrs[j];
            SubKindToStringMap::const_iterator typeIter = _subKindAttributeMap.find(attr.subKind());

            if (typeIter != _subKindAttributeMap.end()) {
                std::string value = attr.value().toStdString();
                value = replaceString(value);
                org[typeIter->second] = Json::Value(value);
            }
        }

        contactOrgs.append(org);
    }
}

void PimContactsQt::populatePhotos(const bbpim::Contact& contact, Json::Value& contactPhotos)
{
    bbpim::ContactService contactService;
    bbpim::Contact fullContact = contactService.contactDetails(contact.id());
    QList<bbpim::ContactPhoto> photos = fullContact.photos();
    bbpim::ContactPhoto primaryPhoto = fullContact.primaryPhoto();

    for (int i = 0; i < photos.size(); i++) {
        bbpim::ContactPhoto currentPhoto = photos[i];
        Json::Value photo;

        photo["originalFilePath"] = Json::Value(currentPhoto.originalPhoto().toStdString());
        photo["largeFilePath"] = Json::Value(currentPhoto.largePhoto().toStdString());
        photo["smallFilePath"] = Json::Value(currentPhoto.smallPhoto().toStdString());
        photo["pref"] = Json::Value((primaryPhoto.id() == currentPhoto.id()));

        contactPhotos.append(photo);
    }
}

void PimContactsQt::populateNews(const bbpim::Contact& contact, Json::Value& contactNews)
{
    QList<bbpim::ContactNews> newsList = contact.news(5);
    QList<bbpim::ContactNews>::const_iterator k = newsList.constBegin();

    while (k != newsList.constEnd()) {
        Json::Value news;
        Json::Value companies;
        QString format = "yyyy-MM-dd";

        std::string body = k->body().toStdString();
        body = replaceString(body);
        news["body"] = Json::Value(body);

        std::string title = k->title().toStdString();
        title = replaceString(title);
        news["title"] = Json::Value(title);

        std::string articleSource = k->articleSource().toStdString();
        articleSource = replaceString(articleSource);
        news["articleSource"] = Json::Value(articleSource);

        news["type"] = Json::Value(k->type().toStdString());
        news["publishedAt"] = Json::Value(QString::number(k->publishedAt().toUTC().toMSecsSinceEpoch()).toStdString());
        news["uri"] = Json::Value(k->uri().toString().toStdString());

        QStringList companiesList = k->companies();
        QStringList::const_iterator j = companiesList.constBegin();

        while (j != companiesList.constEnd()) {
            companies.append(j->toStdString());
            ++j;
        }

        news["companies"] = companies;

        contactNews.append(news);
        ++k;
    }
}

void PimContactsQt::populateActivity(const bbpim::Contact& contact, Json::Value& contactActivity)
{
    QList<bbpim::ContactActivity> activities = contact.activities();
    QList<bbpim::ContactActivity>::const_iterator k = activities.constBegin();

    while (k != activities.constEnd()) {
        Json::Value activity;

        std::string desc = k->description().toStdString();
        desc = replaceString(desc);

        activity["description"] = Json::Value(desc);
        activity["direction"] = Json::Value(k->direction());
        activity["mimeType"] = Json::Value(k->mimeType().toStdString());
        activity["timestamp"] = Json::Value(QString::number(k->statusTimeStamp().toUTC().toMSecsSinceEpoch()).toStdString());

        contactActivity.append(activity);
        ++k;
    }
}

/****************************************************************
 * Helper functions for Save
 ****************************************************************/

void PimContactsQt::addAttributeKind(bbpim::ContactBuilder& contactBuilder, const Json::Value& jsonObj, const std::string& field)
{
    StringToKindMap::const_iterator kindIter = _attributeKindMap.find(field);

    if (kindIter != _attributeKindMap.end()) {
        switch (kindIter->second) {
            // Attributes requiring group keys:
            case bbpim::AttributeKind::Name: {
                QList<SubkindValuePair> convertedList = convertGroupedAttributes(jsonObj);
                addConvertedList(contactBuilder, kindIter->second, convertedList, "1");
                break;
            }
            case bbpim::AttributeKind::OrganizationAffiliation: {
                for (unsigned int i = 0; i < jsonObj.size(); i++) {
                    std::stringstream groupKeyStream;
                    groupKeyStream << i + 1;

                    QList<SubkindValuePair> convertedList = convertGroupedAttributes(jsonObj[i]);
                    addConvertedList(contactBuilder, kindIter->second, convertedList, groupKeyStream.str());
                }

                break;
            }

            // String arrays:
            case bbpim::AttributeKind::VideoChat: {
                QList<SubkindValuePair> convertedList = convertStringArray(jsonObj, bbpim::AttributeSubKind::VideoChatBbPlaybook);
                addConvertedList(contactBuilder, kindIter->second, convertedList);
                break;
            }

            // Dates:
            case bbpim::AttributeKind::Date: {
                StringToSubKindMap::const_iterator subkindIter = _attributeSubKindMap.find(field);

                if (subkindIter != _attributeSubKindMap.end()) {
                    std::string value = jsonObj.asString();
                    addAttribute(contactBuilder, kindIter->second, subkindIter->second, value);
                }

                break;
            }

            // Strings:
            case bbpim::AttributeKind::Note:
            case bbpim::AttributeKind::Sound: {
                StringToSubKindMap::const_iterator subkindIter = _attributeSubKindMap.find(field);

                if (subkindIter != _attributeSubKindMap.end()) {
                    QList<SubkindValuePair> convertedList;
                    std::string value = jsonObj.asString();
                    convertedList.append(SubkindValuePair(subkindIter->second, value));
                    addConvertedList(contactBuilder, kindIter->second, convertedList);
                }

                break;
            }

            // ContactField attributes:
            case bbpim::AttributeKind::Phone:
            case bbpim::AttributeKind::Email:
            case bbpim::AttributeKind::Fax:
            case bbpim::AttributeKind::Pager:
            case bbpim::AttributeKind::InstantMessaging:
            case bbpim::AttributeKind::Website:
            case bbpim::AttributeKind::Group:
            case bbpim::AttributeKind::Profile: {
                QList<SubkindValuePair> convertedList = convertFieldAttributes(jsonObj);
                addConvertedList(contactBuilder, kindIter->second, convertedList);
                break;
            }

            // Special cases (treated differently in ContactBuilder):
            default: {
                if (field == "addresses") {
                    for (unsigned int i = 0; i < jsonObj.size(); i++) {
                        Json::Value addressObj = jsonObj[i];
                        addPostalAddress(contactBuilder, addressObj);
                    }
                } else if (field == "photos") {
                    for (unsigned int i = 0; i < jsonObj.size(); i++) {
                        Json::Value photoObj = jsonObj[i];
                        addPhoto(contactBuilder, photoObj);
                    }
                } else if (field == "favorite") {
                    bool isFavorite = jsonObj.asBool();
                    contactBuilder = contactBuilder.setFavorite(isFavorite);
                }

                break;
            }
        }
    } else if (field == "displayName" || field == "nickname") {
        StringToSubKindMap::const_iterator subkindIter = _attributeSubKindMap.find(field);

        if (subkindIter != _attributeSubKindMap.end()) {
            addAttribute(contactBuilder, bbpim::AttributeKind::Name, subkindIter->second, jsonObj.asString(), "1");
        }
    }
}

void PimContactsQt::syncAttributeKind(bbpim::Contact& contact, const Json::Value& jsonObj, const std::string& field)
{
    StringToKindMap::const_iterator kindIter = _attributeKindMap.find(field);
    bbpim::ContactBuilder contactBuilder(contact.edit());

    if (kindIter != _attributeKindMap.end()) {
        switch (kindIter->second) {
            // Attributes requiring group keys:
            case bbpim::AttributeKind::Name: {
                QList<QList<bbpim::ContactAttribute> > savedList = contact.filteredAttributesByGroupKey(kindIter->second);
                QList<SubkindValuePair> convertedList = convertGroupedAttributes(jsonObj);

                if (!savedList.empty()) {
                    syncConvertedList(contactBuilder, kindIter->second, savedList[0], convertedList, "1");
                } else {
                    addConvertedList(contactBuilder, kindIter->second, convertedList, "1");
                }

                break;
            }
            case bbpim::AttributeKind::OrganizationAffiliation: {
                QList<QList<bbpim::ContactAttribute> > savedList = contact.filteredAttributesByGroupKey(kindIter->second);
                syncAttributeGroup(contactBuilder, kindIter->second, savedList, jsonObj);
                break;
            }

            // String arrays:
            case bbpim::AttributeKind::VideoChat: {
                QList<bbpim::ContactAttribute> savedList = contact.filteredAttributes(kindIter->second);
                QList<SubkindValuePair> convertedList = convertStringArray(jsonObj, bbpim::AttributeSubKind::VideoChatBbPlaybook);
                syncConvertedList(contactBuilder, kindIter->second, savedList, convertedList);
                break;
            }

            // Dates:
            case bbpim::AttributeKind::Date: {
                StringToSubKindMap::const_iterator subkindIter = _attributeSubKindMap.find(field);

                if (subkindIter != _attributeSubKindMap.end()) {
                    QList<bbpim::ContactAttribute> savedList = contact.filteredAttributes(kindIter->second);
                    syncAttribute(contactBuilder, savedList, kindIter->second, subkindIter->second, jsonObj.asString());
                }

                break;
            }

            // Strings:
            case bbpim::AttributeKind::Note:
            case bbpim::AttributeKind::Sound: {
                QList<bbpim::ContactAttribute> savedList = contact.filteredAttributes(kindIter->second);
                QList<SubkindValuePair> convertedList;
                StringToSubKindMap::const_iterator subkindIter = _attributeSubKindMap.find(field);

                if (subkindIter != _attributeSubKindMap.end()) {
                    std::string value = jsonObj.asString();
                    convertedList.append(SubkindValuePair(subkindIter->second, value));
                }

                syncConvertedList(contactBuilder, kindIter->second, savedList, convertedList);
                break;
            }

            // ContactField attributes:
            case bbpim::AttributeKind::Phone:
            case bbpim::AttributeKind::Email:
            case bbpim::AttributeKind::Fax:
            case bbpim::AttributeKind::Pager:
            case bbpim::AttributeKind::InstantMessaging:
            case bbpim::AttributeKind::Website:
            case bbpim::AttributeKind::Group:
            case bbpim::AttributeKind::Profile: {
                QList<bbpim::ContactAttribute> savedList = contact.filteredAttributes(kindIter->second);
                QList<SubkindValuePair> convertedList = convertFieldAttributes(jsonObj);
                syncConvertedList(contactBuilder, kindIter->second, savedList, convertedList);
                break;
            }

            // Special cases (treated differently in ContactBuilder):
            default: {
                if (field == "addresses") {
                    QList<bbpim::ContactPostalAddress> savedList = contact.postalAddresses();
                    syncPostalAddresses(contactBuilder, savedList, jsonObj);
                } else if (field == "photos") {
                    QList<bbpim::ContactPhoto> savedList = contact.photos();
                    syncPhotos(contactBuilder, savedList, jsonObj, contact.primaryPhoto());

                } else if (field == "favorite") {
                    bool isFavorite = jsonObj.asBool();
                    contactBuilder.setFavorite(isFavorite);
                }

                break;
            }
        }
    } else if (field == "displayName" || field == "nickname") {
        StringToSubKindMap::const_iterator subkindIter = _attributeSubKindMap.find(field);

        if (subkindIter != _attributeSubKindMap.end()) {
            QList<QList<bbpim::ContactAttribute> > savedList = contact.filteredAttributesByGroupKey(bbpim::AttributeKind::Name);

            if (!savedList.empty()) {
                syncAttribute(contactBuilder, savedList[0], bbpim::AttributeKind::Name, subkindIter->second, jsonObj.asString(), "1");
            } else {
                addAttribute(contactBuilder, bbpim::AttributeKind::Name, subkindIter->second, jsonObj.asString(), "1");
            }
        }
    }
}


QList<SubkindValuePair> PimContactsQt::convertGroupedAttributes(const Json::Value& fieldsObj)
{
    const Json::Value::Members fields = fieldsObj.getMemberNames();
    QList<SubkindValuePair> convertedList;

    for (unsigned int i = 0; i < fields.size(); i++) {
        const std::string fieldKey = fields[i];
        StringToSubKindMap::const_iterator subkindIter = _attributeSubKindMap.find(fieldKey);

        if (subkindIter != _attributeSubKindMap.end()) {
            convertedList.append(SubkindValuePair(subkindIter->second, fieldsObj[fieldKey].asString()));
        }
    }

    return convertedList;
}

QList<SubkindValuePair> PimContactsQt::convertFieldAttributes(const Json::Value& fieldArray)
{
    QList<SubkindValuePair> convertedList;

    for (unsigned int i = 0; i < fieldArray.size(); i++) {
        Json::Value fieldObj = fieldArray[i];
        std::string type = fieldObj.get("type", "").asString();
        std::string value = fieldObj.get("value", "").asString();
        StringToSubKindMap::const_iterator subkindIter = _attributeSubKindMap.find(type);

        if (subkindIter != _attributeSubKindMap.end()) {
            convertedList.append(SubkindValuePair(subkindIter->second, value));
        }
    }

    return convertedList;
}

QList<SubkindValuePair> PimContactsQt::convertStringArray(const Json::Value& stringArray, bbpim::AttributeSubKind::Type subkind)
{
    QList<SubkindValuePair> convertedList;

    for (unsigned int i = 0; i < stringArray.size(); i++) {
        std::string value = stringArray[i].asString();
        convertedList.append(SubkindValuePair(subkind, value));
    }

    return convertedList;
}

void PimContactsQt::addConvertedList(bbpim::ContactBuilder& contactBuilder, const bbpim::AttributeKind::Type kind, const QList<SubkindValuePair>& convertedList, const std::string& groupKey)
{
    for (int i = 0; i < convertedList.size(); i++) {
        addAttribute(contactBuilder, kind, convertedList[i].first, convertedList[i].second, groupKey);
    }
}

void PimContactsQt::addAttribute(bbpim::ContactBuilder& contactBuilder, const bbpim::AttributeKind::Type kind, const bbpim::AttributeSubKind::Type subkind, const std::string& value, const std::string& groupKey)
{
    bbpim::ContactAttribute attribute;
    bbpim::ContactAttributeBuilder attributeBuilder(attribute.edit());

    attributeBuilder = attributeBuilder.setKind(kind);
    attributeBuilder = attributeBuilder.setSubKind(subkind);

    if (kind == bbpim::AttributeKind::Date) {
        QDateTime date = QDateTime::fromString(QString(value.c_str()), QString("ddd MMM dd yyyy"));

        if (date.isValid()) {
            attributeBuilder = attributeBuilder.setValue(date);
        } else {
            attributeBuilder = attributeBuilder.setValue(QString(value.c_str()));
        }
    } else {
        attributeBuilder = attributeBuilder.setValue(QString(value.c_str()));
    }

    if (!groupKey.empty()) {
        attributeBuilder = attributeBuilder.setGroupKey(QString(groupKey.c_str()));
    }

    contactBuilder.addAttribute(attribute);
}

void PimContactsQt::addPostalAddress(bbpim::ContactBuilder& contactBuilder, const Json::Value& addressObj)
{
    bbpim::ContactPostalAddress address;
    bbpim::ContactPostalAddressBuilder addressBuilder(address.edit());

    if (addressObj.isMember("type")) {
        std::string value = addressObj["type"].asString();
        StringToSubKindMap::const_iterator subkindIter = _attributeSubKindMap.find(value);

        if (subkindIter != _attributeSubKindMap.end()) {
            addressBuilder = addressBuilder.setSubKind(subkindIter->second);
        }
    }

    addressBuilder = addressBuilder.setLine1(QString(addressObj.get("streetAddress", "").asCString()));
    addressBuilder = addressBuilder.setLine2(QString(addressObj.get("streetOther", "").asCString()));
    addressBuilder = addressBuilder.setCity(QString(addressObj.get("locality", "").asCString()));
    addressBuilder = addressBuilder.setRegion(QString(addressObj.get("region", "").asCString()));
    addressBuilder = addressBuilder.setCountry(QString(addressObj.get("country", "").asCString()));
    addressBuilder = addressBuilder.setPostalCode(QString(addressObj.get("postalCode", "").asCString()));

    contactBuilder = contactBuilder.addPostalAddress(address);
}

void PimContactsQt::addPhoto(bbpim::ContactBuilder& contactBuilder, const Json::Value& photoObj)
{
    bbpim::ContactPhoto photo;
    bbpim::ContactPhotoBuilder photoBuilder(photo.edit());

    std::string filepath = photoObj.get("originalFilePath", "").asString();
    bool pref = photoObj.get("pref", false).asBool();

    photoBuilder.setOriginalPhoto(QString(filepath.c_str()));
    photoBuilder.setPrimaryPhoto(pref);

    contactBuilder = contactBuilder.addPhoto(photo, pref);
}

void PimContactsQt::syncConvertedList(bbpim::ContactBuilder& contactBuilder, bbpim::AttributeKind::Type kind, QList<bbpim::ContactAttribute>& savedList, const QList<SubkindValuePair>& convertedList, const std::string& groupKey)
{
    int index;

    for (index = 0; index < savedList.size() && index < convertedList.size(); index++) {
        // Do not overwrite display name or nickname when syncing name
        if (kind == bbpim::AttributeKind::Name &&
            (savedList[index].subKind() == bbpim::AttributeSubKind::NameNickname ||
             savedList[index].subKind() == bbpim::AttributeSubKind::NameDisplayName)) {
            addAttribute(contactBuilder, kind, convertedList[index].first, convertedList[index].second, groupKey);
        } else {
            bbpim::ContactAttributeBuilder attributeBuilder(savedList[index].edit());
            attributeBuilder = attributeBuilder.setSubKind(convertedList[index].first);
            attributeBuilder = attributeBuilder.setValue(QString(convertedList[index].second.c_str()));

            if (!groupKey.empty()) {
                attributeBuilder = attributeBuilder.setGroupKey(QString(groupKey.c_str()));
            }
        }
    }

    if (index < savedList.size()) {
        for (; index < savedList.size(); index++) {
            // Do not delete display name or nickname when syncing name
            if (savedList[index].subKind() != bbpim::AttributeSubKind::NameNickname &&
                savedList[index].subKind() != bbpim::AttributeSubKind::NameDisplayName) {
                contactBuilder = contactBuilder.deleteAttribute(savedList[index]);
            }
        }
    } else if (index < convertedList.size()) {
        for (; index < convertedList.size(); index++) {
            QList<SubkindValuePair> remainingList = convertedList.mid(index);
            addConvertedList(contactBuilder, kind, remainingList, groupKey);
        }
    }
}

void PimContactsQt::syncAttributeGroup(bbpim::ContactBuilder& contactBuilder, bbpim::AttributeKind::Type kind, QList<QList<bbpim::ContactAttribute> > savedList, const Json::Value& jsonObj)
{
    int i;

    for (i = 0; i < static_cast<int>(jsonObj.size()) && i < savedList.size(); i++) {
        std::stringstream groupKeyStream;
        groupKeyStream << i + 1;

        QList<SubkindValuePair> convertedList = convertGroupedAttributes(jsonObj[i]);
        syncConvertedList(contactBuilder, kind, savedList[i], convertedList, groupKeyStream.str());
    }

    if (i < savedList.size()) {
        for (; i < savedList.size(); i++) {
            for (int j = 0; j < savedList[i].size(); j++) {
                contactBuilder = contactBuilder.deleteAttribute(savedList[i][j]);
            }
        }
    } else if (i < static_cast<int>(jsonObj.size())) {
        for (; i < static_cast<int>(jsonObj.size()); i++) {
            std::stringstream groupKeyStream;
            groupKeyStream << i + 1;

            QList<SubkindValuePair> convertedList = convertGroupedAttributes(jsonObj[i]);
            addConvertedList(contactBuilder, kind, convertedList, groupKeyStream.str());
        }
    }
}

void PimContactsQt::syncAttribute(bbpim::ContactBuilder& contactBuilder, QList<bbpim::ContactAttribute>& savedList, const bbpim::AttributeKind::Type kind, const bbpim::AttributeSubKind::Type subkind, const std::string& value, const std::string& groupKey)
{
    bool found = false;

    for (int i = 0; i < savedList.size() && !found; i++) {
        if (savedList[i].subKind() == subkind) {
            bbpim::ContactAttributeBuilder attributeBuilder(savedList[i].edit());

            if (kind == bbpim::AttributeKind::Date) {
                QDateTime date = QDateTime::fromString(QString(value.c_str()), QString("ddd MMM dd yyyy"));

                if (date.isValid()) {
                    attributeBuilder = attributeBuilder.setValue(date);
                } else {
                    attributeBuilder = attributeBuilder.setValue(QString(value.c_str()));
                }
            } else {
                attributeBuilder = attributeBuilder.setValue(QString(value.c_str()));

                if (!groupKey.empty()) {
                    attributeBuilder = attributeBuilder.setGroupKey(QString(groupKey.c_str()));
                }
            }

            found = true;
        }
    }

    if (!found) {
        addAttribute(contactBuilder, kind, subkind, value, groupKey);
    }
}

void PimContactsQt::syncPostalAddresses(bbpim::ContactBuilder& contactBuilder, QList<bbpim::ContactPostalAddress>& savedList, const Json::Value& jsonObj)
{
    int i;

    for (i = 0; i < savedList.size() && i < static_cast<int>(jsonObj.size()); i++) {
        Json::Value addressObj = jsonObj[i];
        bbpim::ContactPostalAddressBuilder addressBuilder(savedList[i].edit());

        std::string type = addressObj.get("type", "other").asString();
        StringToSubKindMap::const_iterator subkindIter = _attributeSubKindMap.find(type);

        if (subkindIter != _attributeSubKindMap.end()) {
            addressBuilder = addressBuilder.setSubKind(subkindIter->second);
        }

        addressBuilder = addressBuilder.setLine1(QString(addressObj.get("streetAddress", "").asCString()));
        addressBuilder = addressBuilder.setLine2(QString(addressObj.get("streetOther", "").asCString()));
        addressBuilder = addressBuilder.setCity(QString(addressObj.get("locality", "").asCString()));
        addressBuilder = addressBuilder.setRegion(QString(addressObj.get("region", "").asCString()));
        addressBuilder = addressBuilder.setCountry(QString(addressObj.get("country", "").asCString()));
        addressBuilder = addressBuilder.setPostalCode(QString(addressObj.get("postalCode", "").asCString()));
    }

    if (i < savedList.size()) {
        for (; i < savedList.size(); i++) {
            contactBuilder = contactBuilder.deletePostalAddress(savedList[i]);
        }
    } else if (i < static_cast<int>(jsonObj.size())) {
        for (; i < static_cast<int>(jsonObj.size()); i++) {
            addPostalAddress(contactBuilder, jsonObj[i]);
        }
    }
}

void PimContactsQt::syncPhotos(bbpim::ContactBuilder& contactBuilder, QList<bbpim::ContactPhoto>& savedList, const Json::Value& jsonObj, const bbpim::ContactPhoto& primaryPhoto)
{
    int i;

    // We must do the delete first, because there seems to be a problem if we do it after
    if (savedList.size() > static_cast<int>(jsonObj.size())) {
        for (i = jsonObj.size(); i < savedList.size(); i++) {
            contactBuilder = contactBuilder.deletePhoto(savedList[i]);
        }
    }

    for (i = 0; i < savedList.size() && i < static_cast<int>(jsonObj.size()); i++) {
        std::string filepath = jsonObj[i].get("originalFilePath", "").asString();
        bool pref = jsonObj[i].get("pref", false).asBool();

        if (filepath != savedList[i].originalPhoto().toStdString()) {
            contactBuilder = contactBuilder.deletePhoto(savedList[i]);
            addPhoto(contactBuilder, jsonObj[i]);
        } else if (pref != (primaryPhoto.id() == savedList[i].id())) {
            bbpim::ContactPhotoBuilder photoBuilder = savedList[i].edit();
            photoBuilder.setPrimaryPhoto(pref);
        }
    }

    if (i < static_cast<int>(jsonObj.size())) {
        for (; i < static_cast<int>(jsonObj.size()); i++) {
            addPhoto(contactBuilder, jsonObj[i]);
        }
    }
}

/****************************************************************
 * Mapping functions
 ****************************************************************/

void PimContactsQt::createAttributeKindMap()
{
    _attributeKindMap["phoneNumbers"] = bbpim::AttributeKind::Phone;
    _attributeKindMap["faxNumbers"] = bbpim::AttributeKind::Fax;
    _attributeKindMap["pagerNumbers"] = bbpim::AttributeKind::Pager;
    _attributeKindMap["emails"] = bbpim::AttributeKind::Email;
    _attributeKindMap["urls"] = bbpim::AttributeKind::Website;
    _attributeKindMap["socialNetworks"] = bbpim::AttributeKind::Profile;
    _attributeKindMap["anniversary"] = bbpim::AttributeKind::Date;
    _attributeKindMap["birthday"] = bbpim::AttributeKind::Date;
    _attributeKindMap["categories"] = bbpim::AttributeKind::Group;
    _attributeKindMap["name"] = bbpim::AttributeKind::Name;
    _attributeKindMap["organizations"] = bbpim::AttributeKind::OrganizationAffiliation;
    _attributeKindMap["education"] = bbpim::AttributeKind::Education;
    _attributeKindMap["note"] = bbpim::AttributeKind::Note;
    _attributeKindMap["ims"] = bbpim::AttributeKind::InstantMessaging;
    _attributeKindMap["ringtone"] = bbpim::AttributeKind::Sound;
    _attributeKindMap["videoChat"] = bbpim::AttributeKind::VideoChat;
    _attributeKindMap["addresses"] = bbpim::AttributeKind::Invalid;
    _attributeKindMap["favorite"] = bbpim::AttributeKind::Invalid;
    _attributeKindMap["photos"] = bbpim::AttributeKind::Invalid;
    _attributeKindMap["news"] = bbpim::AttributeKind::Invalid;
    _attributeKindMap["activities"] = bbpim::AttributeKind::Invalid;
}

void PimContactsQt::createAttributeSubKindMap()
{
    _attributeSubKindMap["other"] = bbpim::AttributeSubKind::Other;
    _attributeSubKindMap["home"] = bbpim::AttributeSubKind::Home;
    _attributeSubKindMap["work"] = bbpim::AttributeSubKind::Work;
    _attributeSubKindMap["mobile"] = bbpim::AttributeSubKind::PhoneMobile;
    _attributeSubKindMap["direct"] = bbpim::AttributeSubKind::FaxDirect;
    _attributeSubKindMap["blog"] = bbpim::AttributeSubKind::Blog;
    _attributeSubKindMap["resume"] = bbpim::AttributeSubKind::WebsiteResume;
    _attributeSubKindMap["portfolio"] = bbpim::AttributeSubKind::WebsitePortfolio;
    _attributeSubKindMap["personal"] = bbpim::AttributeSubKind::WebsitePersonal;
    _attributeSubKindMap["company"] = bbpim::AttributeSubKind::WebsiteCompany;
    _attributeSubKindMap["facebook"] = bbpim::AttributeSubKind::ProfileFacebook;
    _attributeSubKindMap["twitter"] = bbpim::AttributeSubKind::ProfileTwitter;
    _attributeSubKindMap["linkedin"] = bbpim::AttributeSubKind::ProfileLinkedIn;
    _attributeSubKindMap["gist"] = bbpim::AttributeSubKind::ProfileGist;
    _attributeSubKindMap["tungle"] = bbpim::AttributeSubKind::ProfileTungle;
    _attributeSubKindMap["birthday"] = bbpim::AttributeSubKind::DateBirthday;
    _attributeSubKindMap["anniversary"] = bbpim::AttributeSubKind::DateAnniversary;
    _attributeSubKindMap["categories"] = bbpim::AttributeSubKind::GroupDepartment;
    _attributeSubKindMap["givenName"] = bbpim::AttributeSubKind::NameGiven;
    _attributeSubKindMap["familyName"] = bbpim::AttributeSubKind::NameSurname;
    _attributeSubKindMap["honorificPrefix"] = bbpim::AttributeSubKind::Title;
    _attributeSubKindMap["honorificSuffix"] = bbpim::AttributeSubKind::NameSuffix;
    _attributeSubKindMap["middleName"] = bbpim::AttributeSubKind::NameMiddle;
    _attributeSubKindMap["nickname"] = bbpim::AttributeSubKind::NameNickname;
    _attributeSubKindMap["displayName"] = bbpim::AttributeSubKind::NameDisplayName;
    _attributeSubKindMap["phoneticGivenName"] = bbpim::AttributeSubKind::NamePhoneticGiven;
    _attributeSubKindMap["phoneticFamilyName"] = bbpim::AttributeSubKind::NamePhoneticSurname;
    _attributeSubKindMap["name"] = bbpim::AttributeSubKind::OrganizationAffiliationName;
    _attributeSubKindMap["department"] = bbpim::AttributeSubKind::OrganizationAffiliationDetails;
    _attributeSubKindMap["title"] = bbpim::AttributeSubKind::Title;
    _attributeSubKindMap["BbmPin"] = bbpim::AttributeSubKind::InstantMessagingBbmPin;
    _attributeSubKindMap["Aim"] = bbpim::AttributeSubKind::InstantMessagingAim;
    _attributeSubKindMap["Aliwangwang"] = bbpim::AttributeSubKind::InstantMessagingAliwangwang;
    _attributeSubKindMap["GoogleTalk"] = bbpim::AttributeSubKind::InstantMessagingGoogleTalk;
    _attributeSubKindMap["Sametime"] = bbpim::AttributeSubKind::InstantMessagingSametime;
    _attributeSubKindMap["Icq"] = bbpim::AttributeSubKind::InstantMessagingIcq;
    _attributeSubKindMap["Jabber"] = bbpim::AttributeSubKind::InstantMessagingJabber;
    _attributeSubKindMap["MsLcs"] = bbpim::AttributeSubKind::InstantMessagingMsLcs;
    _attributeSubKindMap["Skype"] = bbpim::AttributeSubKind::InstantMessagingSkype;
    _attributeSubKindMap["YahooMessenger"] = bbpim::AttributeSubKind::InstantMessagingYahooMessenger;
    _attributeSubKindMap["YahooMessegerJapan"] = bbpim::AttributeSubKind::InstantMessagingYahooMessengerJapan;
    _attributeSubKindMap["BbPlaybook"] = bbpim::AttributeSubKind::VideoChatBbPlaybook;
    _attributeSubKindMap["ringtone"] = bbpim::AttributeSubKind::SoundRingtone;
    _attributeSubKindMap["note"] = bbpim::AttributeSubKind::Invalid;
}

void PimContactsQt::createKindAttributeMap() {
    _kindAttributeMap[bbpim::AttributeKind::Phone] = "phoneNumbers";
    _kindAttributeMap[bbpim::AttributeKind::Fax] = "faxNumbers";
    _kindAttributeMap[bbpim::AttributeKind::Pager] = "pagerNumber";
    _kindAttributeMap[bbpim::AttributeKind::Email] = "emails";
    _kindAttributeMap[bbpim::AttributeKind::Website] = "urls";
    _kindAttributeMap[bbpim::AttributeKind::Profile] = "socialNetworks";
    _kindAttributeMap[bbpim::AttributeKind::OrganizationAffiliation] = "organizations";
    _kindAttributeMap[bbpim::AttributeKind::Education] = "education";
    _kindAttributeMap[bbpim::AttributeKind::Note] = "note";
    _kindAttributeMap[bbpim::AttributeKind::InstantMessaging] = "ims";
    _kindAttributeMap[bbpim::AttributeKind::VideoChat] = "videoChat";
    _kindAttributeMap[bbpim::AttributeKind::Sound] = "ringtone";
    _kindAttributeMap[bbpim::AttributeKind::Website] = "urls";
}

void PimContactsQt::createSubKindAttributeMap() {
    _subKindAttributeMap[bbpim::AttributeSubKind::Other] = "other";
    _subKindAttributeMap[bbpim::AttributeSubKind::Home] = "home";
    _subKindAttributeMap[bbpim::AttributeSubKind::Work] = "work";
    _subKindAttributeMap[bbpim::AttributeSubKind::PhoneMobile] = "mobile";
    _subKindAttributeMap[bbpim::AttributeSubKind::FaxDirect] = "direct";
    _subKindAttributeMap[bbpim::AttributeSubKind::Blog] = "blog";
    _subKindAttributeMap[bbpim::AttributeSubKind::WebsiteResume] = "resume";
    _subKindAttributeMap[bbpim::AttributeSubKind::WebsitePortfolio] = "portfolio";
    _subKindAttributeMap[bbpim::AttributeSubKind::WebsitePersonal] = "personal";
    _subKindAttributeMap[bbpim::AttributeSubKind::WebsiteCompany] = "company";
    _subKindAttributeMap[bbpim::AttributeSubKind::ProfileFacebook] = "facebook";
    _subKindAttributeMap[bbpim::AttributeSubKind::ProfileTwitter] = "twitter";
    _subKindAttributeMap[bbpim::AttributeSubKind::ProfileLinkedIn] = "linkedin";
    _subKindAttributeMap[bbpim::AttributeSubKind::ProfileGist] = "gist";
    _subKindAttributeMap[bbpim::AttributeSubKind::ProfileTungle] = "tungle";
    _subKindAttributeMap[bbpim::AttributeSubKind::DateBirthday] = "birthday";
    _subKindAttributeMap[bbpim::AttributeSubKind::DateAnniversary] = "anniversary";
    _subKindAttributeMap[bbpim::AttributeSubKind::NameGiven] = "givenName";
    _subKindAttributeMap[bbpim::AttributeSubKind::NameSurname] = "familyName";
    _subKindAttributeMap[bbpim::AttributeSubKind::Title] = "honorificPrefix";
    _subKindAttributeMap[bbpim::AttributeSubKind::NameSuffix] = "honorificSuffix";
    _subKindAttributeMap[bbpim::AttributeSubKind::NameMiddle] = "middleName";
    _subKindAttributeMap[bbpim::AttributeSubKind::NamePhoneticGiven] = "phoneticGivenName";
    _subKindAttributeMap[bbpim::AttributeSubKind::NamePhoneticSurname] = "phoneticFamilyName";
    _subKindAttributeMap[bbpim::AttributeSubKind::NameNickname] = "nickname";
    _subKindAttributeMap[bbpim::AttributeSubKind::NameDisplayName] = "displayName";
    _subKindAttributeMap[bbpim::AttributeSubKind::OrganizationAffiliationName] = "name";
    _subKindAttributeMap[bbpim::AttributeSubKind::OrganizationAffiliationDetails] = "department";
    _subKindAttributeMap[bbpim::AttributeSubKind::Title] = "title";
    _subKindAttributeMap[bbpim::AttributeSubKind::InstantMessagingBbmPin] = "BbmPin";
    _subKindAttributeMap[bbpim::AttributeSubKind::InstantMessagingAim] = "Aim";
    _subKindAttributeMap[bbpim::AttributeSubKind::InstantMessagingAliwangwang] = "Aliwangwang";
    _subKindAttributeMap[bbpim::AttributeSubKind::InstantMessagingGoogleTalk] = "GoogleTalk";
    _subKindAttributeMap[bbpim::AttributeSubKind::InstantMessagingSametime] = "Sametime";
    _subKindAttributeMap[bbpim::AttributeSubKind::InstantMessagingIcq] = "Icq";
    _subKindAttributeMap[bbpim::AttributeSubKind::InstantMessagingJabber] = "Jabber";
    _subKindAttributeMap[bbpim::AttributeSubKind::InstantMessagingMsLcs] = "MsLcs";
    _subKindAttributeMap[bbpim::AttributeSubKind::InstantMessagingSkype] = "Skype";
    _subKindAttributeMap[bbpim::AttributeSubKind::InstantMessagingYahooMessenger] = "YahooMessenger";
    _subKindAttributeMap[bbpim::AttributeSubKind::InstantMessagingYahooMessengerJapan] = "YahooMessegerJapan";
    _subKindAttributeMap[bbpim::AttributeSubKind::VideoChatBbPlaybook] = "BbPlaybook";
    _subKindAttributeMap[bbpim::AttributeSubKind::SoundRingtone] = "ringtone";
    _subKindAttributeMap[bbpim::AttributeSubKind::Personal] = "personal";
}

} // namespace webworks

