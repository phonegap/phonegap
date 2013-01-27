/*  
	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	
	http://www.apache.org/licenses/LICENSE-2.0
	
	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

using Microsoft.Phone.Tasks;
using Microsoft.Phone.UserData;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.Serialization;
using System.Windows;
using DeviceContacts = Microsoft.Phone.UserData.Contacts;


namespace WPCordovaClassLib.Cordova.Commands
{
    [DataContract]
    public class SearchOptions
    {
        [DataMember]
        public string filter { get; set; }
        [DataMember]
        public bool multiple { get; set; }
    }

    [DataContract]
    public class ContactSearchParams
    {
        [DataMember]
        public string[] fields { get; set; }
        [DataMember]
        public SearchOptions options { get; set; }
    }

    [DataContract]
    public class JSONContactAddress
    {
        [DataMember]
        public string formatted { get; set; }
        [DataMember]
        public string type { get; set; }
        [DataMember]
        public string streetAddress { get; set; }
        [DataMember]
        public string locality { get; set; }
        [DataMember]
        public string region { get; set; }
        [DataMember]
        public string postalCode { get; set; }
        [DataMember]
        public string country { get; set; }
        [DataMember]
        public bool pref { get; set; }
    }

    [DataContract]
    public class JSONContactName
    {
        [DataMember]
        public string formatted { get; set; }
        [DataMember]
        public string familyName { get; set; }
        [DataMember]
        public string givenName { get; set; }
        [DataMember]
        public string middleName { get; set; }
        [DataMember]
        public string honorificPrefix { get; set; }
        [DataMember]
        public string honorificSuffix { get; set; }
    }

    [DataContract]
    public class JSONContactField
    {
        [DataMember]
        public string type { get; set; }
        [DataMember]
        public string value { get; set; }
        [DataMember]
        public bool pref { get; set; }
    }

    [DataContract]
    public class JSONContactOrganization
    {
        [DataMember]
        public string type { get; set; }
        [DataMember]
        public string name { get; set; }
        [DataMember]
        public bool pref { get; set; }
        [DataMember]
        public string department { get; set; }
        [DataMember]
        public string title { get; set; }
    }

    [DataContract]
    public class JSONContact
    {
        [DataMember]
        public string id { get; set; }
        [DataMember]
        public string rawId { get; set; }
        [DataMember]
        public string displayName { get; set; }
        [DataMember]
        public string nickname { get; set; }
        [DataMember]
        public string note { get; set; }

        [DataMember]
        public JSONContactName name { get; set; }

        [DataMember]
        public JSONContactField[] emails { get; set; }

        [DataMember]
        public JSONContactField[] phoneNumbers { get; set; }

        [DataMember]
        public JSONContactField[] ims { get; set; }

        [DataMember]
        public JSONContactField[] photos { get; set; }

        [DataMember]
        public JSONContactField[] categories { get; set; }

        [DataMember]
        public JSONContactField[] urls { get; set; }

        [DataMember]
        public JSONContactOrganization[] organizations { get; set; }

        [DataMember]
        public JSONContactAddress[] addresses { get; set; }
    }


    public class Contacts : BaseCommand
    {

        public const int UNKNOWN_ERROR = 0;
        public const int INVALID_ARGUMENT_ERROR = 1;
        public const int TIMEOUT_ERROR = 2;
        public const int PENDING_OPERATION_ERROR = 3;
        public const int IO_ERROR = 4;
        public const int NOT_SUPPORTED_ERROR = 5;
        public const int PERMISSION_DENIED_ERROR = 20;
        public const int SYNTAX_ERR = 8;

        public Contacts()
        {

        }

        // refer here for contact properties we can access: http://msdn.microsoft.com/en-us/library/microsoft.phone.tasks.savecontacttask_members%28v=VS.92%29.aspx
        public void save(string jsonContact)
        {

            // jsonContact is actually an array of 1 {contact}
            string[] args = JSON.JsonHelper.Deserialize<string[]>(jsonContact);


            JSONContact contact = JSON.JsonHelper.Deserialize<JSONContact>(args[0]);

            SaveContactTask contactTask = new SaveContactTask();

            if (contact.nickname != null)
            {
                contactTask.Nickname = contact.nickname;
            }
            if (contact.urls != null && contact.urls.Length > 0)
            {
                contactTask.Website = contact.urls[0].value;
            }
            if (contact.note != null)
            {
                contactTask.Notes = contact.note;
            }

            #region contact.name
            if (contact.name != null)
            {
                if (contact.name.givenName != null)
                    contactTask.FirstName = contact.name.givenName;
                if (contact.name.familyName != null)
                    contactTask.LastName = contact.name.familyName;
                if (contact.name.middleName != null)
                    contactTask.MiddleName = contact.name.middleName;
                if (contact.name.honorificSuffix != null)
                    contactTask.Suffix = contact.name.honorificSuffix;
                if (contact.name.honorificPrefix != null)
                    contactTask.Title = contact.name.honorificPrefix;
            }
            #endregion

            #region contact.org
            if (contact.organizations != null && contact.organizations.Count() > 0)
            {
                contactTask.Company = contact.organizations[0].name;
                contactTask.JobTitle = contact.organizations[0].title;
            }
            #endregion

            #region contact.phoneNumbers
            if (contact.phoneNumbers != null && contact.phoneNumbers.Length > 0)
            {
                foreach (JSONContactField field in contact.phoneNumbers)
                {
                    string fieldType = field.type.ToLower();
                    if (fieldType == "work")
                    {
                        contactTask.WorkPhone = field.value;
                    }
                    else if (fieldType == "home")
                    {
                        contactTask.HomePhone = field.value;
                    }
                    else if (fieldType == "mobile")
                    {
                        contactTask.MobilePhone = field.value;
                    }
                }
            }
            #endregion

            #region contact.emails

            if (contact.emails != null && contact.emails.Length > 0)
            {

                // set up different email types if they are not explicitly defined
                foreach (string type in new string[] { "personal", "work", "other" })
                {
                    foreach (JSONContactField field in contact.emails)
                    {
                        if (field != null && String.IsNullOrEmpty(field.type))
                        {
                            field.type = type;
                            break;
                        }
                    }
                }

                foreach (JSONContactField field in contact.emails)
                {
                    if (field != null)
                    {
                        if (field.type != null && field.type != "other")
                        {
                            string fieldType = field.type.ToLower();
                            if (fieldType == "work")
                            {
                                contactTask.WorkEmail = field.value;
                            }
                            else if (fieldType == "home" || fieldType == "personal")
                            {
                                contactTask.PersonalEmail = field.value;
                            }
                        }
                        else
                        {
                            contactTask.OtherEmail = field.value;
                        }
                    }

                }
            }
            #endregion

            if (contact.note != null && contact.note.Length > 0)
            {
                contactTask.Notes = contact.note;
            }

            #region contact.addresses
            if (contact.addresses != null && contact.addresses.Length > 0)
            {
                foreach (JSONContactAddress address in contact.addresses)
                {
                    if (address.type == null)
                    {
                        address.type = "home"; // set a default
                    }
                    string fieldType = address.type.ToLower();
                    if (fieldType == "work")
                    {
                        contactTask.WorkAddressCity = address.locality;
                        contactTask.WorkAddressCountry = address.country;
                        contactTask.WorkAddressState = address.region;
                        contactTask.WorkAddressStreet = address.streetAddress;
                        contactTask.WorkAddressZipCode = address.postalCode;
                    }
                    else if (fieldType == "home" || fieldType == "personal")
                    {
                        contactTask.HomeAddressCity = address.locality;
                        contactTask.HomeAddressCountry = address.country;
                        contactTask.HomeAddressState = address.region;
                        contactTask.HomeAddressStreet = address.streetAddress;
                        contactTask.HomeAddressZipCode = address.postalCode;
                    }
                    else
                    {
                        // no other address fields available ...
                        Debug.WriteLine("Creating contact with unsupported address type :: " + address.type);
                    }
                }
            }
            #endregion


            contactTask.Completed += new EventHandler<SaveContactResult>(ContactSaveTaskCompleted);
            contactTask.Show();
        }

        void ContactSaveTaskCompleted(object sender, SaveContactResult e)
        {
            SaveContactTask task = sender as SaveContactTask;

            if (e.TaskResult == TaskResult.OK)
            {

                Deployment.Current.Dispatcher.BeginInvoke(() =>
                {
                    DeviceContacts deviceContacts = new DeviceContacts();
                    deviceContacts.SearchCompleted += new EventHandler<ContactsSearchEventArgs>(postAdd_SearchCompleted);

                    string displayName = String.Format("{0}{2}{1}", task.FirstName, task.LastName, String.IsNullOrEmpty(task.FirstName) ? "" : " ");

                    deviceContacts.SearchAsync(displayName, FilterKind.DisplayName, task);
                });


            }
            else if (e.TaskResult == TaskResult.Cancel)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Operation cancelled."));
            }
        }

        void postAdd_SearchCompleted(object sender, ContactsSearchEventArgs e)
        {
            if (e.Results.Count() > 0)
            {
                List<Contact> foundContacts = new List<Contact>();

                int n = (from Contact contact in e.Results select contact.GetHashCode()).Max();
                Contact newContact = (from Contact contact in e.Results
                                      where contact.GetHashCode() == n
                                      select contact).First();

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, FormatJSONContact(newContact, null)));
            }
            else
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.NO_RESULT));
            }
        }



        public void remove(string id)
        {
            // note id is wrapped in [] and always has exactly one string ...
            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "{\"code\":" + NOT_SUPPORTED_ERROR + "}"));
        }

        public void search(string searchCriteria)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(searchCriteria);

            ContactSearchParams searchParams = new ContactSearchParams();
            try
            {
                searchParams.fields = JSON.JsonHelper.Deserialize<string[]>(args[0]);
                searchParams.options = JSON.JsonHelper.Deserialize<SearchOptions>(args[1]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, INVALID_ARGUMENT_ERROR));
                return;
            }

            if (searchParams.options == null)
            {
                searchParams.options = new SearchOptions();
                searchParams.options.filter = "";
                searchParams.options.multiple = true;
            }

            DeviceContacts deviceContacts = new DeviceContacts();
            deviceContacts.SearchCompleted += new EventHandler<ContactsSearchEventArgs>(contacts_SearchCompleted);

            // default is to search all fields
            FilterKind filterKind = FilterKind.None;
            // if only one field is specified, we will try the 3 available DeviceContact search filters
            if (searchParams.fields.Count() == 1)
            {
                if (searchParams.fields.Contains("name"))
                {
                    filterKind = FilterKind.DisplayName;
                }
                else if (searchParams.fields.Contains("emails"))
                {
                    filterKind = FilterKind.EmailAddress;
                }
                else if (searchParams.fields.Contains("phoneNumbers"))
                {
                    filterKind = FilterKind.PhoneNumber;
                }
            }

            try
            {

                deviceContacts.SearchAsync(searchParams.options.filter, filterKind, searchParams);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("search contacts exception :: " + ex.Message);
            }
        }

        private void contacts_SearchCompleted(object sender, ContactsSearchEventArgs e)
        {
            ContactSearchParams searchParams = (ContactSearchParams)e.State;

            List<Contact> foundContacts = null;

            // if we have multiple search fields
            if (searchParams.options.filter.Length > 0 && searchParams.fields.Count() > 1)
            {
                foundContacts = new List<Contact>();
                if (searchParams.fields.Contains("emails"))
                {
                    foundContacts.AddRange(from Contact con in e.Results
                                           from ContactEmailAddress a in con.EmailAddresses
                                           where a.EmailAddress.Contains(searchParams.options.filter)
                                           select con);
                }
                if (searchParams.fields.Contains("displayName"))
                {
                    foundContacts.AddRange(from Contact con in e.Results
                                           where con.DisplayName.Contains(searchParams.options.filter)
                                           select con);
                }
                if (searchParams.fields.Contains("name"))
                {
                    foundContacts.AddRange(from Contact con in e.Results
                                           where con.CompleteName != null && con.CompleteName.ToString().Contains(searchParams.options.filter)
                                           select con);
                }
                if (searchParams.fields.Contains("phoneNumbers"))
                {
                    foundContacts.AddRange(from Contact con in e.Results
                                           from ContactPhoneNumber a in con.PhoneNumbers
                                           where a.PhoneNumber.Contains(searchParams.options.filter)
                                           select con);
                }
                if (searchParams.fields.Contains("urls"))
                {
                    foundContacts.AddRange(from Contact con in e.Results
                                           from string a in con.Websites
                                           where a.Contains(searchParams.options.filter)
                                           select con);
                }
            }
            else
            {
                foundContacts = new List<Contact>(e.Results);
            }

            //List<string> contactList = new List<string>();

            string strResult = "";

            IEnumerable<Contact> distinctContacts = foundContacts.Distinct();

            foreach (Contact contact in distinctContacts)
            {
                strResult += FormatJSONContact(contact, null) + ",";
                //contactList.Add(FormatJSONContact(contact, null));
                if (!searchParams.options.multiple)
                {
                    break; // just return the first item
                }
            }
            PluginResult result = new PluginResult(PluginResult.Status.OK);
            result.Message = "[" + strResult.TrimEnd(',') + "]";
            DispatchCommandResult(result);

        }

        private string FormatJSONPhoneNumbers(Contact con)
        {
            string retVal = "";
            string contactFieldFormat = "\"type\":\"{0}\",\"value\":\"{1}\",\"pref\":\"false\"";
            foreach (ContactPhoneNumber number in con.PhoneNumbers)
            {

                string contactField = string.Format(contactFieldFormat,
                                                    number.Kind.ToString(),
                                                    number.PhoneNumber);

                retVal += "{" + contactField + "},";
            }
            return retVal.TrimEnd(',');
        }

        private string FormatJSONEmails(Contact con)
        {
            string retVal = "";
            string contactFieldFormat = "\"type\":\"{0}\",\"value\":\"{1}\",\"pref\":\"false\"";
            foreach (ContactEmailAddress address in con.EmailAddresses)
            {
                string contactField = string.Format(contactFieldFormat,
                                                    address.Kind.ToString(),
                                                    address.EmailAddress);

                retVal += "{" + contactField + "},";
            }
            return retVal.TrimEnd(',');
        }

        private string getFormattedJSONAddress(ContactAddress address, bool isPrefered)
        {

            string addressFormatString = "\"pref\":{0}," + // bool
                          "\"type\":\"{1}\"," +
                          "\"formatted\":\"{2}\"," +
                          "\"streetAddress\":\"{3}\"," +
                          "\"locality\":\"{4}\"," +
                          "\"region\":\"{5}\"," +
                          "\"postalCode\":\"{6}\"," +
                          "\"country\":\"{7}\"";

            string formattedAddress = address.PhysicalAddress.AddressLine1 + " "
                                    + address.PhysicalAddress.AddressLine2 + " "
                                    + address.PhysicalAddress.City + " "
                                    + address.PhysicalAddress.StateProvince + " "
                                    + address.PhysicalAddress.CountryRegion + " "
                                    + address.PhysicalAddress.PostalCode;

            string jsonAddress = string.Format(addressFormatString,
                                               isPrefered ? "\"true\"" : "\"false\"",
                                               address.Kind.ToString(),
                                               formattedAddress,
                                               address.PhysicalAddress.AddressLine1 + " " + address.PhysicalAddress.AddressLine2,
                                               address.PhysicalAddress.City,
                                               address.PhysicalAddress.StateProvince,
                                               address.PhysicalAddress.PostalCode,
                                               address.PhysicalAddress.CountryRegion);

            //Debug.WriteLine("getFormattedJSONAddress returning :: " + jsonAddress);

            return "{" + jsonAddress + "}";
        }

        private string FormatJSONAddresses(Contact con)
        {
            string retVal = "";
            foreach (ContactAddress address in con.Addresses)
            {
                retVal += this.getFormattedJSONAddress(address, false) + ",";
            }

            //Debug.WriteLine("FormatJSONAddresses returning :: " + retVal);
            return retVal.TrimEnd(',');
        }

        private string FormatJSONWebsites(Contact con)
        {
            string retVal = "";
            foreach (string website in con.Websites)
            {
                retVal += "\"" + website + "\",";
            }
            return retVal.TrimEnd(',');
        }

        /*
         *  formatted: The complete name of the contact. (DOMString)
            familyName: The contacts family name. (DOMString)
            givenName: The contacts given name. (DOMString)
            middleName: The contacts middle name. (DOMString)
            honorificPrefix: The contacts prefix (example Mr. or Dr.) (DOMString)
            honorificSuffix: The contacts suffix (example Esq.). (DOMString)
         */
        private string FormatJSONName(Contact con)
        {
            string retVal = "";
            string formatStr = "\"formatted\":\"{0}\"," +
                                "\"familyName\":\"{1}\"," +
                                "\"givenName\":\"{2}\"," +
                                "\"middleName\":\"{3}\"," +
                                "\"honorificPrefix\":\"{4}\"," +
                                "\"honorificSuffix\":\"{5}\"";

            if (con.CompleteName != null)
            {
                retVal = string.Format(formatStr,
                                   con.CompleteName.FirstName + " " + con.CompleteName.LastName, // TODO: does this need suffix? middlename?
                                   con.CompleteName.LastName,
                                   con.CompleteName.FirstName,
                                   con.CompleteName.MiddleName,
                                   con.CompleteName.Title,
                                   con.CompleteName.Suffix);
            }
            else
            {
                retVal = string.Format(formatStr,"","","","","","");
            }

            return "{" + retVal + "}";
        }

        private string FormatJSONContact(Contact con, string[] fields)
        {

            string contactFormatStr = "\"id\":\"{0}\"," +
                                      "\"displayName\":\"{1}\"," +
                                      "\"nickname\":\"{2}\"," +
                                      "\"phoneNumbers\":[{3}]," +
                                      "\"emails\":[{4}]," +
                                      "\"addresses\":[{5}]," +
                                      "\"urls\":[{6}]," +
                                      "\"name\":{7}," +
                                      "\"note\":\"{8}\"," +
                                      "\"birthday\":\"{9}\"";


            string jsonContact = String.Format(contactFormatStr,
                                               con.GetHashCode(),
                                               con.DisplayName,
                                               con.CompleteName != null ? con.CompleteName.Nickname : "",
                                               FormatJSONPhoneNumbers(con),
                                               FormatJSONEmails(con),
                                               FormatJSONAddresses(con),
                                               FormatJSONWebsites(con),
                                               FormatJSONName(con),
                                               con.Notes.FirstOrDefault(),
                                               con.Birthdays.FirstOrDefault());

            //Debug.WriteLine("jsonContact = " + jsonContact);
            // JSON requires new line characters be escaped
            return "{" + jsonContact.Replace("\n", "\\n") + "}";
        }
    }
}
