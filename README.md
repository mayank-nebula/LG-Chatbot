# 1. Login with your own credentials
# A browser popup will appear. Sign in with your standard Power BI account.
Connect-PowerBIServiceAccount

# 2. Define your IDs
# Replace these with your actual IDs from the URLs in Power BI Service
$workspaceB_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Workspace where the REPORT is
$reportB_ID    = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # The Report ID in Workspace B
$datasetC_ID   = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # The New Semantic Model ID in Workspace C

# 3. Construct the API URL for "Rebind Report"
$url = "groups/$workspaceB_ID/reports/$reportB_ID/Rebind"

# 4. Create the Body (JSON)
$body = @{
    datasetId = $datasetC_ID
} | ConvertTo-Json

# 5. Call the API
try {
    Invoke-PowerBIRestMethod -Url $url -Method Post -Body $body
    Write-Host "Success! Report in Workspace B now points to Model in Workspace C." -ForegroundColor Green
}
catch {
    Write-Host "Error Rebinding Report:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
