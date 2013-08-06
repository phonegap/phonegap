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

#include <json/reader.h>
#include <json/writer.h>
#include <string>
#include "pim_contacts_js.hpp"
#include "pim_contacts_qt.hpp"

PimContacts::PimContacts(const std::string& id) : m_id(id)
{
}

char* onGetObjList()
{
    // Return list of classes in the object
    static char name[] = "PimContacts";
    return name;
}

JSExt* onCreateObject(const std::string& className, const std::string& id)
{
    // Make sure we are creating the right class
    if (className != "PimContacts") {
        return 0;
    }

    return new PimContacts(id);
}

std::string PimContacts::InvokeMethod(const std::string& command)
{
    unsigned int index = command.find_first_of(" ");

    string strCommand;
    string jsonObject;
    Json::Value *obj;

    if (index != std::string::npos) {
        strCommand = command.substr(0, index);
        jsonObject = command.substr(index + 1, command.length());

        // Parse the JSON
        obj = new Json::Value;
        bool parse = Json::Reader().parse(jsonObject, *obj);

        if (!parse) {
            return "Cannot parse JSON object";
        }
    } else {
        strCommand = command;
        obj = NULL;
    }

    if (strCommand == "find") {
        startThread(FindThread, obj);
    } else if (strCommand == "save") {
        startThread(SaveThread, obj);
    } else if (strCommand == "remove") {
        startThread(RemoveThread, obj);
    } else if (strCommand == "getContact") {
        std::string result = Json::FastWriter().write(webworks::PimContactsQt().GetContact(*obj));
        delete obj;
        return result;
    } else if (strCommand == "invokePicker") {
        Json::Value result = webworks::PimContactsQt::InvokePicker(*obj);
        delete obj;

        std::string event = Json::FastWriter().write(result);
        NotifyEvent("invokeContactPicker.invokeEventId", event);
    } else if (strCommand == "getContactAccounts") {
        return Json::FastWriter().write(webworks::PimContactsQt::GetContactAccounts());
    }

    return "";
}

bool PimContacts::CanDelete()
{
    return true;
}

// Notifies JavaScript of an event
void PimContacts::NotifyEvent(const std::string& eventId, const std::string& event)
{
    std::string eventString = m_id + " result ";
    eventString.append(eventId);
    eventString.append(" ");
    eventString.append(event);
    SendPluginEvent(eventString.c_str(), m_pContext);
}

bool PimContacts::startThread(ThreadFunc threadFunction, Json::Value *jsonObj) {
    webworks::PimContactsThreadInfo *thread_info = new webworks::PimContactsThreadInfo;
    thread_info->parent = this;
    thread_info->jsonObj = jsonObj;
    thread_info->eventId = jsonObj->removeMember("_eventId").asString();

    pthread_attr_t thread_attr;
    pthread_attr_init(&thread_attr);
    pthread_attr_setdetachstate(&thread_attr, PTHREAD_CREATE_DETACHED);

    pthread_t thread;
    pthread_create(&thread, &thread_attr, threadFunction, static_cast<void *>(thread_info));
    pthread_attr_destroy(&thread_attr);

    if (!thread) {
        return false;
    }

    return true;
}


// Static functions:

void* PimContacts::FindThread(void *args)
{
    webworks::PimContactsThreadInfo *thread_info = static_cast<webworks::PimContactsThreadInfo *>(args);

    webworks::PimContactsQt pim_qt;
    Json::Value result = pim_qt.Find(*(thread_info->jsonObj));
    delete thread_info->jsonObj;

    std::string event = Json::FastWriter().write(result);
    thread_info->parent->NotifyEvent(thread_info->eventId, event);
    delete thread_info;

    return NULL;
}

void* PimContacts::SaveThread(void *args)
{
    webworks::PimContactsThreadInfo *thread_info = static_cast<webworks::PimContactsThreadInfo *>(args);

    webworks::PimContactsQt pim_qt;
    Json::Value result = pim_qt.Save(*(thread_info->jsonObj));
    delete thread_info->jsonObj;

    std::string event = Json::FastWriter().write(result);
    thread_info->parent->NotifyEvent(thread_info->eventId, event);
    delete thread_info;

    return NULL;
}

void* PimContacts::RemoveThread(void *args)
{
    webworks::PimContactsThreadInfo *thread_info = static_cast<webworks::PimContactsThreadInfo *>(args);

    webworks::PimContactsQt pim_qt;
    Json::Value result = pim_qt.DeleteContact(*(thread_info->jsonObj));
    delete thread_info->jsonObj;

    std::string event = Json::FastWriter().write(result);
    thread_info->parent->NotifyEvent(thread_info->eventId, event);
    delete thread_info;

    return NULL;
}

