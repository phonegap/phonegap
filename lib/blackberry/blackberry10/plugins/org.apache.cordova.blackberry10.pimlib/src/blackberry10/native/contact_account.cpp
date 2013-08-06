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

#include <webworks_utils.hpp>
#include "contact_account.hpp"

ContactAccount& ContactAccount::GetAccountInstance()
{
    static ContactAccount ca;
    return ca;
}

ContactAccount::ContactAccount()
{
    fetchContactAccounts();
}

ContactAccount::~ContactAccount()
{}

QList<bb::pim::account::Account> ContactAccount::GetContactAccounts(bool fresh)
{
    if (fresh) {
        fetchContactAccounts();
    }
    return _accounts;
}

bb::pim::account::Account ContactAccount::GetAccount(bb::pim::account::AccountKey id, bool fresh)
{
    if (fresh) {
        fetchContactAccounts();
    }
    return _accountMap.value(id);
}

Json::Value ContactAccount::Account2Json(const bb::pim::account::Account& account)
{
    Json::Value jsonAccount;
    jsonAccount["id"] = webworks::Utils::intToStr(account.id());
    jsonAccount["name"] = account.displayName().isEmpty() ? account.provider().name().toStdString() : account.displayName().toStdString();
    jsonAccount["enterprise"] = account.isEnterprise() == 1 ? true : false;

    return jsonAccount;
}

void ContactAccount::fetchContactAccounts()
{
    QList<bb::pim::account::Account> accounts = _accountService.accounts(bb::pim::account::Service::Contacts);

    _accounts.clear();
    _accountMap.clear();
    for (QList<bb::pim::account::Account>::const_iterator it = accounts.begin(); it != accounts.end(); ++it) {
        if ((it->id() != ID_UNIFIED_ACCOUNT) && (it->id() != ID_ENHANCED_ACCOUNT)) {
            _accounts.append(*it);
            _accountMap.insert(it->id(), (bb::pim::account::Account)(*it));
        }
    }
}


