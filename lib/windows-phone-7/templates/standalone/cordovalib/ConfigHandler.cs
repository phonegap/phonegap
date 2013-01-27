using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Resources;
using System.Xml.Linq;

namespace WPCordovaClassLib.CordovaLib
{
    class ConfigHandler
    {
        protected List<string> AllowedPlugins;
        protected List<string> AllowedDomains;
        protected Dictionary<string, string> Preferences;

        protected bool AllowAllDomains = false;
        protected bool AllowAllPlugins = false;

        public ConfigHandler()
        {
            AllowedPlugins = new List<string>();
            AllowedDomains = new List<string>();
            Preferences = new Dictionary<string, string>();
        }

        public string GetPreference(string key)
        {
            return Preferences[key];
        }

/*
    - (BOOL)URLIsAllowed:(NSURL*)url
{
    if (self.expandedWhitelist == nil) {
        return NO;
    }

    if (self.allowAll) {
        return YES;
    }

    // iterate through settings ExternalHosts, check for equality
    NSEnumerator* enumerator = [self.expandedWhitelist objectEnumerator];
    id regex = nil;
    NSString* urlHost = [url host];

    // if the url host IS found in the whitelist, load it in the app (however UIWebViewNavigationTypeOther kicks it out to Safari)
    // if the url host IS NOT found in the whitelist, we do nothing
    while (regex = [enumerator nextObject]) {
        NSPredicate* regex_test = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", regex];

        if ([regex_test evaluateWithObject:urlHost] == YES) {
            // if it matches at least one rule, return
            return YES;
        }
    }

    NSLog(@"%@", [self errorStringForURL:url]);
    // if we got here, the url host is not in the white-list, do nothing
    return NO;
}*/
        protected static string[] AllowedSchemes = {"http","https","ftp","ftps"};
        protected bool SchemeIsAllowed(string scheme)
        {
            return AllowedSchemes.Contains(scheme);
        }

        protected string PathAndQuery(Uri uri)
        {
            string result = uri.LocalPath;
            if (uri.Query.Length > 0)
            {
                result +=  uri.Query;
            }
            return result;
        }

        protected void AddWhiteListEntry(string origin, bool allowSubdomains)
        {

            if (origin == "*")
            {
                AllowAllDomains = true;
            }

            if (AllowAllDomains)
            {
                return;
            }

            string hostMatchingRegex = "";
            string hostName;

            try
            {

                Uri uri = new Uri(origin.Replace("*", "replaced-text"), UriKind.Absolute);

                string tempHostName = uri.Host.Replace("replaced-text", "*");
                //if (uri.HostNameType == UriHostNameType.Dns){}        
                // starts with wildcard match - we make the first '.' optional (so '*.org.apache.cordova' will match 'org.apache.cordova')
                if (tempHostName.StartsWith("*."))
                {    //"(\\s{0}|*.)"
                    hostName = @"\w*.*" + tempHostName.Substring(2).Replace(".", @"\.").Replace("*", @"\w*");
                }
                else
                {
                    hostName = tempHostName.Replace(".", @"\.").Replace("*", @"\w*");
                }

                //  "^https?://"
                hostMatchingRegex = uri.Scheme + "://" + hostName + PathAndQuery(uri);
                //Debug.WriteLine("Adding regex :: " + hostMatchingRegex);
                AllowedDomains.Add(hostMatchingRegex);

            }
            catch (Exception)
            {
                Debug.WriteLine("Invalid Whitelist entry (probably missing the protocol):: " + origin);
            }

        }

        /**   
         
         An access request is granted for a given URI if there exists an item inside the access-request list such that:

            - The URI's scheme component is the same as scheme; and
            - if subdomains is false or if the URI's host component is not a domain name (as defined in [RFC1034]), the URI's host component is the same as host; or
            - if subdomains is true, the URI's host component is either the same as host, or is a subdomain of host (as defined in [RFC1034]); and
            - the URI's port component is the same as port.
         
         **/

        public bool URLIsAllowed(string url)
        {
            // easy case first
            if (AllowAllDomains )
            {
                return true;
            }
            else
            {
                // start simple
                Uri uri = new Uri(url,UriKind.RelativeOrAbsolute);
                if (uri.IsAbsoluteUri)
                {
                    if (this.SchemeIsAllowed(uri.Scheme))
                    {
                        // additional test because our pattern will always have a trailing '/'
                        string matchUrl = url;
                        if (PathAndQuery(uri) == "/")
                        {
                            matchUrl = url + "/";
                        }
                        foreach (string pattern in AllowedDomains)
                        {
                            if (Regex.IsMatch(matchUrl, pattern))
                            {
                                // make sure it is at the start, and not part of the query string
                                // special case :: http://some.other.domain/page.html?x=1&g=http://build.apache.org/
                                if ( Regex.IsMatch(uri.Scheme + "://" +  uri.Host + "/", pattern) ||
                                     (!Regex.IsMatch(PathAndQuery(uri), pattern)))
                                {
                                    return true;
                                }
                            }
                        }
                    }
                }
                else
                {
                    return true;
                }
            }
            return false;
        }

        public bool IsPluginAllowed(string key)
        {
            return AllowAllPlugins || AllowedPlugins.Contains(key);
        }


        public void LoadAppPackageConfig()
        {
            StreamResourceInfo streamInfo = Application.GetResourceStream(new Uri("config.xml", UriKind.Relative));

            if (streamInfo != null)
            {
                StreamReader sr = new StreamReader(streamInfo.Stream);
                //This will Read Keys Collection for the xml file
                XDocument document = XDocument.Parse(sr.ReadToEnd());

                var plugins = from results in document.Descendants("plugin")
                              select new { name = (string)results.Attribute("name") };


                foreach (var plugin in plugins)
                {
                    Debug.WriteLine("plugin " + plugin.name);
                    if (plugin.name == "*")
                    {
                        AllowAllPlugins = true;
                        break;
                    }
                    else
                    {
                        AllowedPlugins.Add(plugin.name);
                    }
                }

                var preferences = from results in document.Descendants("preference")
                                  select new
                                  {
                                      name = (string)results.Attribute("name"),
                                      value = (string)results.Attribute("value")
                                  };

                foreach (var pref in preferences)
                {
                    Debug.WriteLine("pref" + pref.name + ", " + pref.value);
                }

                var accessList = from results in document.Descendants("access")
                                 select new
                                 {
                                     origin = (string)results.Attribute("origin"),
                                     subdomains = (string)results.Attribute("subdomains") == "true"
                                 };

                foreach (var accessElem in accessList)
                {
                    AddWhiteListEntry(accessElem.origin, accessElem.subdomains);
                }
            }
            else
            {
                // no config.xml, allow all
                AllowAllDomains = true;
                AllowAllPlugins = true;
            }
        }
    }
}
