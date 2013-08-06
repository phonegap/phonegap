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

#ifndef _CONTACT_ACCOUNT_HPP_
#define _CONTACT_ACCOUNT_HPP_

#include <bb/pim/account/Account>
#include <bb/pim/account/AccountService>
#include <bb/pim/account/Provider>

#include <json/value.h>
#include <QList>
#include <QDebug>

class ContactAccount
{
public:
    static ContactAccount& GetAccountInstance();

    // get all available accounts which provide contact service
    QList<bb::pim::account::Account> GetContactAccounts(bool fresh = false);
    // get the contact account with the specific id
    bb::pim::account::Account GetAccount(bb::pim::account::AccountKey id, bool fresh = false);
    // serialize account to json object
    static Json::Value Account2Json(const bb::pim::account::Account& account);

private:
    ContactAccount();
    ~ContactAccount();
    explicit ContactAccount(ContactAccount const&);
    void operator=(ContactAccount const&);
    // Refresh the accounts list and map
    void fetchContactAccounts();
    QMap<bb::pim::account::AccountKey, bb::pim::account::Account> _accountMap;
    QList<bb::pim::account::Account> _accounts;
    bb::pim::account::AccountService _accountService;
    static const int ID_UNIFIED_ACCOUNT = 4;
    static const int ID_ENHANCED_ACCOUNT = 6;
};

#endif // end of _CONTACT_ACCOUNT_HPP_
