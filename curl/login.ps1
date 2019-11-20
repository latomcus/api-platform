$data = @{"action"="user.create";
    "params" = @{
        "email" = "test2@test1.com";
        "password" = "test123456"
    };
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri http://localhost:3000 -Method POST -Body $data -ContentType "application/json"
Write-Host $response.Content
$response.Content | ConvertFrom-Json | Select code, message

# invoke-expression -Command .\login.ps1
# .\login.ps1