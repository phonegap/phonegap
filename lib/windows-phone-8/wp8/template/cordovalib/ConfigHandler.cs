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
        public class PluginConfig
        {
            public PluginConfig(string name, bool autoLoad = false)
            {
                Name = name;
                isAutoLoad = autoLoad;
            }
            public string Name;
            public bool isAutoLoad;
        }

        protected Dictionary<string, PluginConfig> AllowedPlugins;
        protected List<string> AllowedDomains;
        protected Dictionary<string, string> Preferences;

        public string ContentSrc { get; private set; }

        protected bool AllowAllDomains = false;
        protected bool AllowAllPlugins = false;

        public ConfigHandler()
        {
            AllowedPlugins = new Dictionary<string, PluginConfig>();
            AllowedDomains = new List<string>();
            Preferences = new Dictionary<string, string>();
        }

        public string GetPreference(string key)
        {
            return Preferences[key];
        }

        protected static string[] AllowedSchemes = { "http", "https", "ftp", "ftps" };
        protected bool SchemeIsAllowed(string scheme)
        {
            return AllowedSchemes.Contains(scheme);
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
                hostMatchingRegex = uri.Scheme + "://" + hostName + uri.PathAndQuery;
                Debug.WriteLine("Adding regex :: " + hostMatchingRegex);
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
            if (this.AllowAllDomains)
            {
                return true;
            }
            else
            {
                // start simple
                Uri uri = new Uri(url, UriKind.RelativeOrAbsolute);
                if (uri.IsAbsoluteUri)
                {
                    if (this.SchemeIsAllowed(uri.Scheme))
                    {
                        // additional test because our pattern will always have a trailing '/'
                        string matchUrl = url;
                        if (uri.PathAndQuery == "/")
                        {
                            matchUrl = url + "/";
                        }
                        foreach (string pattern in AllowedDomains)
                        {
                            if (Regex.IsMatch(matchUrl, pattern))
                            {
                                // make sure it is at the start, and not part of the query string
                                // special case :: http://some.other.domain/page.html?x=1&g=http://build.apache.org/
                                if (Regex.IsMatch(uri.Scheme + "://" + uri.Host + "/", pattern) ||
                                     (!Regex.IsMatch(uri.PathAndQuery, pattern)))
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
            return AllowAllPlugins || AllowedPlugins.Keys.Contains(key);
        }

        public string[] AutoloadPlugins
        {
            get
            {
                // TODO:
                var res = from results in AllowedPlugins.TakeWhile(p => p.Value.isAutoLoad)
                          select results.Value.Name;

                return new string[] { "", "asd" };
            }
        }

        private void LoadPluginFeatures(XDocument document)
        {
            var plugins = from results in document.Descendants("plugin")
                          select new
                          {
                              name = (string)results.Attribute("name"),
                              autoLoad = results.Attribute("onload")
                          };

            foreach (var plugin in plugins)
            {
                Debug.WriteLine("Warning: Deprecated use of <plugin> by plugin : " + plugin.name);
                PluginConfig pConfig = new PluginConfig(plugin.name, plugin.autoLoad != null && plugin.autoLoad.Value == "true");
                if (pConfig.Name == "*")
                {
                    AllowAllPlugins = true;
                    // break; wait, don't, some still could be autoload
                }
                else
                {
                    AllowedPlugins[pConfig.Name] = pConfig;
                }
            }

            var features = document.Descendants("feature");
    

            foreach (var feature in features)
            {
                var name = feature.Attribute("name");
                var values = from results in feature.Descendants("param")
                             where ((string)results.Attribute("name") == "wp-package")
                             select results;

                var value = values.FirstOrDefault();
                if(value != null)
                {
                    string key = (string)value.Attribute("value");
                    Debug.WriteLine("Adding feature.value=" + key);
                    var onload = value.Attribute("onload");
                    PluginConfig pConfig = new PluginConfig(key,onload != null && onload.Value == "true");
                    AllowedPlugins[key] = pConfig;
                }
            }
        }

        public void LoadAppPackageConfig()
        {
            StreamResourceInfo streamInfo = Application.GetResourceStream(new Uri("config.xml", UriKind.Relative));

            if (streamInfo != null)
            {
                StreamReader sr = new StreamReader(streamInfo.Stream);
                //This will Read Keys Collection for the xml file
                XDocument document = XDocument.Parse(sr.ReadToEnd());

                LoadPluginFeatures(document);

                var preferences = from results in document.Descendants("preference")
                                  select new
                                  {
                                      name = (string)results.Attribute("name"),
                                      value = (string)results.Attribute("value")
                                  };

                foreach (var pref in preferences)
                {
                    Preferences[pref.name] = pref.value;
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

                var contentsTag = document.Descendants("content").FirstOrDefault();
                if (contentsTag != null)
                {
                    var src = contentsTag.Attribute("src");
                    ContentSrc = (string)src.Value;
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
