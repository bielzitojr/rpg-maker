param([Parameter(Mandatory=$true)][string]$CredentialPath)
$ErrorActionPreference = 'Stop'
try {
    Import-Module ([System.IO.Path]::Combine($PSHOME, 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1')) -ErrorAction Stop
    $protectedValue = [System.IO.File]::ReadAllText($CredentialPath)
    $secureValue = ConvertTo-SecureString $protectedValue.Trim()
    $credential = [System.Management.Automation.PSCredential]::new('Gemini', $secureValue)
    [Console]::Out.Write($credential.GetNetworkCredential().Password)
} catch {
    [Console]::Error.WriteLine('Credential read failed: ' + $_.Exception.GetType().FullName)
    exit 1
}
