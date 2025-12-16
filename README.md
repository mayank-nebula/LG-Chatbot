import msal
import requests
import json
import sys

# ==============================================================================
# 1. CONFIGURATION (Replace these with your actual IDs)
# ==============================================================================
WORKSPACE_B_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Workspace containing the Report
REPORT_B_ID    = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # The Report ID in Workspace B
DATASET_C_ID   = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # The New Semantic Model ID in Workspace C

# ==============================================================================
# 2. AUTHENTICATION (Interactive Login)
# ==============================================================================
# This is the standard "Microsoft Power BI Management" Client ID.
# It allows us to log in without registering a new app in Azure.
CLIENT_ID = "1950a258-227b-4e31-a9cf-717495945fc2" 
AUTHORITY = "https://login.microsoftonline.com/common"
SCOPES    = ["https://analysis.windows.net/powerbi/api/Report.ReadWrite.All"]

app = msal.PublicClientApplication(CLIENT_ID, authority=AUTHORITY)

# Attempt to get a token interactively (opens browser)
print("Initiating login... please check your browser.")
result = app.acquire_token_interactive(scopes=SCOPES)

if "access_token" in result:
    access_token = result['access_token']
    print("Authentication successful!")
else:
    print(f"Authentication failed: {result.get('error_description')}")
    sys.exit(1)

# ==============================================================================
# 3. CALL THE REBIND API
# ==============================================================================
url = f"https://api.powerbi.com/v1.0/myorg/groups/{WORKSPACE_B_ID}/reports/{REPORT_B_ID}/Rebind"

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

body = {
    "datasetId": DATASET_C_ID
}

print(f"Rebinding Report {REPORT_B_ID} to Dataset {DATASET_C_ID}...")

try:
    response = requests.post(url, headers=headers, data=json.dumps(body))
    
    # Check for success (200 OK)
    if response.status_code == 200:
        print("✅ Success! The report has been rebound.")
    else:
        print(f"❌ Error {response.status_code}: {response.text}")

except Exception as e:
    print(f"An error occurred: {e}")
