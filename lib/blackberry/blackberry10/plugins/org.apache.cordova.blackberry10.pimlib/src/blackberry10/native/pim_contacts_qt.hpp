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

#ifndef PIM_CONTACTS_QT_H_
#define PIM_CONTACTS_QT_H_

#include <json/value.h>
#include <bb/pim/contacts/ContactService.hpp>
#include <bb/pim/contacts/ContactConsts.hpp>
#include <bb/pim/contacts/Contact.hpp>
#include <bb/pim/contacts/ContactBuilder.hpp>
#include <bb/pim/contacts/ContactAttribute.hpp>
#include <bb/pim/contacts/ContactAttributeBuilder.hpp>
#include <bb/pim/contacts/ContactPostalAddress.hpp>
#include <bb/pim/contacts/ContactPostalAddressBuilder.hpp>
#include <bb/pim/contacts/ContactPhoto.hpp>
#include <bb/pim/contacts/ContactPhotoBuilder.hpp>
#include <bb/pim/contacts/ContactListFilters.hpp>
#include <bb/pim/account/AccountService.hpp>
#include <bb/pim/account/Account.hpp>
#include <bb/pim/account/Provider>
#include <webworks_utils.hpp>

#include <string>
#include <utility>
#include <map>

#include "contact_account.hpp"

class PimContacts;

namespace webworks {

namespace bbpim = bb::pim::contacts;
namespace bbpimacc = bb::pim::account;

typedef std::map<std::string, bbpim::AttributeKind::Type> StringToKindMap;
typedef std::map<std::string, bbpim::AttributeSubKind::Type> StringToSubKindMap;
typedef std::map<bbpim::AttributeKind::Type, std::string> KindToStringMap;
typedef std::map<bbpim::AttributeSubKind::Type, std::string> SubKindToStringMap;

typedef std::pair<bbpim::AttributeSubKind::Type, std::string> SubkindValuePair;

enum PimContactsError {
    UNKNOWN_ERROR = 0,
    INVALID_ARGUMENT_ERROR = 1,
    TIMEOUT_ERROR = 2,
    PENDING_OPERATION_ERROR = 3,
    IO_ERROR = 4,
    NOT_SUPPORTED_ERROR = 5,
    PERMISSION_DENIED_ERROR = 20,
};

struct PimContactsThreadInfo {
    PimContacts *parent;
    Json::Value *jsonObj;
    std::string eventId;
};

class PimContactsQt {
public:
    PimContactsQt();
    ~PimContactsQt();
    Json::Value Find(const Json::Value& argsObj);
    Json::Value Save(const Json::Value& attributeObj);
    Json::Value CreateContact(const Json::Value& attributeObj);
    Json::Value DeleteContact(const Json::Value& contactObj);
    Json::Value EditContact(bbpim::Contact& contact, const Json::Value& attributeObj);
    Json::Value CloneContact(bbpim::Contact& contact, const Json::Value& attributeObj);
    Json::Value GetContact(const Json::Value& argsObj);
    static Json::Value InvokePicker(const Json::Value& args);
    static Json::Value GetContactAccounts();

private:
    // Helper functions for Find
    Json::Value assembleSearchResults(const QSet<bbpim::ContactId>& results, const Json::Value& contactFields, int limit);
    Json::Value populateContact(const bbpim::Contact& contact, const Json::Value& contactFields);
    void populateField(const bbpim::Contact& contact, bbpim::AttributeKind::Type kind, Json::Value& contactItem, bool isContactField, bool isArray);
    void populateDisplayNameNickName(const bbpim::Contact& contact, Json::Value& contactItem, const std::string& field);
    void populateOrganizations(const bbpim::Contact& contact, Json::Value& contactOrgs);
    void populateAddresses(const bbpim::Contact& contact, Json::Value& contactAddrs);
    void populatePhotos(const bbpim::Contact& contact, Json::Value& contactPhotos);
    void populateNews(const bbpim::Contact& contact, Json::Value& contactNews);
    void populateActivity(const bbpim::Contact& contact, Json::Value& contactActivity);
    static void populateAccount(const bbpimacc::Account& account, Json::Value& jsonAccount);

    static QSet<bbpim::ContactId> singleFieldSearch(const Json::Value& searchFieldsJson, const Json::Value& contactFields, const bool favorite, const Json::Value& includeAccounts, const Json::Value& excludeAccounts);
    static QString getSortFieldValue(const bbpim::SortColumn::Type sortField, const bbpim::Contact& contact);
    static QList<bbpim::SearchField::Type> getSearchFields(const Json::Value& searchFieldsJson);
    static void getSortSpecs(const Json::Value& sort);
    static QSet<bbpim::ContactId> getPartialSearchResults(const Json::Value& filter, const Json::Value& contactFields, const bool favorite, const Json::Value& includeAccounts, const Json::Value& excludeAccounts);
    static bool lessThan(const bbpim::Contact& c1, const bbpim::Contact& c2);
    static std::string replaceAll(const std::string& s, const std::string& souce = "\"", const std::string& target = "\\\"");
    static std::string replaceString(const std::string& s);
    static QList<bbpim::AttributeKind::Type> getIncludeAttributesList(const Json::Value& contactFields, bbpim::ContactListFilters* listFilters = NULL);
    static void getAccountFilters(bbpim::ContactSearchFilters* searchFilter, bbpim::ContactListFilters* listFilter, const Json::Value& includeAccounts, const Json::Value& excludeAccounts);

    // Helper functions for Save
    void addAttributeKind(bbpim::ContactBuilder& contactBuilder, const Json::Value& jsonObj, const std::string& field);
    void addPostalAddress(bbpim::ContactBuilder& contactBuilder, const Json::Value& addressObj);
    void addPhoto(bbpim::ContactBuilder& contactBuilder, const Json::Value& photoObj);

    void syncAttributeKind(bbpim::Contact& contact, const Json::Value& jsonObj, const std::string& field);
    void syncConvertedList(bbpim::ContactBuilder& contactBuilder, bbpim::AttributeKind::Type kind, QList<bbpim::ContactAttribute>& savedList, const QList<SubkindValuePair>& convertedList, const std::string& groupKey = "");
    void syncAttributeGroup(bbpim::ContactBuilder& contactBuilder, bbpim::AttributeKind::Type kind, QList<QList<bbpim::ContactAttribute> > savedList, const Json::Value& jsonObj);
    void syncAttribute(bbpim::ContactBuilder& contactBuilder, QList<bbpim::ContactAttribute>& savedList, const bbpim::AttributeKind::Type kind, const bbpim::AttributeSubKind::Type subkind, const std::string& value, const std::string& groupKey = "");
    void syncPostalAddresses(bbpim::ContactBuilder& contactBuilder, QList<bbpim::ContactPostalAddress>& savedList, const Json::Value& jsonObj);
    void syncPhotos(bbpim::ContactBuilder& contactBuilder, QList<bbpim::ContactPhoto>& savedList, const Json::Value& jsonObj, const bbpim::ContactPhoto& primaryPhoto);

    void addConvertedList(bbpim::ContactBuilder& contactBuilder, const bbpim::AttributeKind::Type kind, const QList<SubkindValuePair>& convertedList, const std::string& groupKey = "");
    void addAttribute(bbpim::ContactBuilder& contactBuilder, const bbpim::AttributeKind::Type kind, const bbpim::AttributeSubKind::Type subkind, const std::string& value, const std::string& groupKey = "");

    QList<SubkindValuePair> convertGroupedAttributes(const Json::Value& fieldsObj);
    QList<SubkindValuePair> convertFieldAttributes(const Json::Value& fieldArray);
    QList<SubkindValuePair> convertStringArray(const Json::Value& stringArray, bbpim::AttributeSubKind::Type subkind);

    // Mappings between JSON strings and attribute kinds/subkinds
    static void createAttributeKindMap();
    static void createAttributeSubKindMap();
    static void createKindAttributeMap();
    static void createSubKindAttributeMap();

    static StringToKindMap _attributeKindMap;
    static StringToSubKindMap _attributeSubKindMap;
    static KindToStringMap _kindAttributeMap;
    static SubKindToStringMap _subKindAttributeMap;
    static QList<bbpim::SortSpecifier> _sortSpecs;

    static std::map<bbpim::ContactId, bbpim::Contact> _contactSearchMap;
    static ContactAccount& _contactAccount;
};

} // namespace webworks

#endif // PIM_CONTACTS_QT_H_
