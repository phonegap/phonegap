
#include <stdio.h>
#include <tchar.h>
#include <shlobj.h>
#include <stdio.h>
#include <shobjidl.h>
#include <objbase.h>
#include <atlbase.h>
#include <string>
#include <AppxPackaging.h>

int _tmain(int argc, _TCHAR* argv[])
{
    DWORD dwProcessId = 0;
    HRESULT hr = CoInitializeEx(NULL, COINIT_APARTMENTTHREADED);

    if(SUCCEEDED(hr))
    {
        if(argc == 2)
        {
            CComPtr<IAppxManifestReader> spManifestReader;

            CComPtr<IApplicationActivationManager> spAppActivationManager;
            // get IApplicationActivationManager
            hr = CoCreateInstance(CLSID_ApplicationActivationManager,
                                    NULL,
                                    CLSCTX_LOCAL_SERVER,
                                    IID_IApplicationActivationManager,
                                    (LPVOID*)&spAppActivationManager);

            // allow it to be launched in the foreground.
            if (SUCCEEDED(hr))
            {
                hr = CoAllowSetForegroundWindow(spAppActivationManager, NULL);
            }
 
            // Launch it!
            if (SUCCEEDED(hr))
            {  
                hr = spAppActivationManager->ActivateApplication((LPCWSTR)argv[1],
                                                                NULL,
                                                                AO_NONE,
                                                                &dwProcessId);
            }
        }
        else 
        {
            printf("%s","Missing Command Line Argument");
            hr = E_ABORT;
        }
        CoUninitialize();
    }

    if(SUCCEEDED(hr))
    {
       printf("%s","Successfully Deployed.");
    }
    
    return hr;
}

