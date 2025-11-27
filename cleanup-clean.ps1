# cleanup.ps1
Write-Host "I4IGUANA - Cleanup & Setup" -ForegroundColor Cyan
Write-Host ""

$projectId = "i4iguana-89ed1"
$baseUrl = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents"

Write-Host "STEP 1: Deleting dummy users..." -ForegroundColor Yellow
Write-Host ""

$response = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get

$deleteCount = 0
foreach ($doc in $response.documents) {
    $docId = $doc.name.Split('/')[-1]
    
    $isDummy = $false
    if ($docId -match '^(ashkelon_|nearby_|test_|dummy_)') {
        $isDummy = $true
    }
    elseif ($doc.fields.isDummy.booleanValue -eq $true) {
        $isDummy = $true
    }
    
    if ($isDummy) {
        try {
            Invoke-RestMethod -Uri $doc.name -Method Delete | Out-Null
            Write-Host "Deleted: $docId" -ForegroundColor Red
            $deleteCount++
        }
        catch {
            Write-Host "Failed to delete: $docId" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Deleted $deleteCount dummy users!" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 2: Creating 5 new female dummy users..." -ForegroundColor Yellow
Write-Host ""

$baseLat = 31.6964864
$baseLng = 34.5800704

$users = @(
    @{ id = "nearby_user_1"; name = "Sarah"; age = 25; dist = 120 }
    @{ id = "nearby_user_2"; name = "Maya"; age = 27; dist = 230 }
    @{ id = "nearby_user_3"; name = "Noa"; age = 24; dist = 350 }
    @{ id = "nearby_user_4"; name = "Yael"; age = 26; dist = 180 }
    @{ id = "nearby_user_5"; name = "Shira"; age = 23; dist = 290 }
)

foreach ($user in $users) {
    $offset = $user.dist / 111000
    $latOffset = ($offset * (Get-Random -Minimum -1.0 -Maximum 1.0))
    $lngOffset = ($offset * (Get-Random -Minimum -1.0 -Maximum 1.0))
    $lat = $baseLat + $latOffset
    $lng = $baseLng + $lngOffset
    $geohash = "sv" + [Math]::Floor($lat * 100)
    
    $userData = @{
        fields = @{
            uid = @{ stringValue = $user.id }
            name = @{ stringValue = $user.name }
            displayName = @{ stringValue = $user.name }
            age = @{ integerValue = $user.age }
            email = @{ stringValue = "$($user.id)@dummy.com" }
            gender = @{ stringValue = "female" }
            photoURL = @{ stringValue = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" }
            photos = @{
                arrayValue = @{
                    values = @(
                        @{ stringValue = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" }
                    )
                }
            }
            hobbies = @{
                arrayValue = @{
                    values = @(
                        @{ stringValue = "Reading" }
                        @{ stringValue = "Yoga" }
                    )
                }
            }
            bio = @{ stringValue = "Looking for something real" }
            onboardingComplete = @{ booleanValue = $true }
            location = @{
                mapValue = @{
                    fields = @{
                        latitude = @{ doubleValue = $lat }
                        longitude = @{ doubleValue = $lng }
                        geohash = @{ stringValue = $geohash }
                        lastUpdated = @{ timestampValue = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
                    }
                }
            }
            preferences = @{
                mapValue = @{
                    fields = @{
                        minDistance = @{ integerValue = 10 }
                        maxDistance = @{ integerValue = 500 }
                        ageRange = @{
                            arrayValue = @{
                                values = @(
                                    @{ integerValue = 20 }
                                    @{ integerValue = 35 }
                                )
                            }
                        }
                        lookingFor = @{ stringValue = "male" }
                    }
                }
            }
            swipedRight = @{ arrayValue = @{ values = @() } }
            swipedLeft = @{ arrayValue = @{ values = @() } }
            matches = @{ arrayValue = @{ values = @() } }
            lastActive = @{ timestampValue = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
            createdAt = @{ timestampValue = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
            isDummy = @{ booleanValue = $true }
            deleted = @{ booleanValue = $false }
        }
    }
    
    try {
        $json = $userData | ConvertTo-Json -Depth 10
        Invoke-RestMethod -Uri "$baseUrl/users?documentId=$($user.id)" -Method Post -Body $json -ContentType "application/json" | Out-Null
        Write-Host "Created: $($user.name) at $($user.dist)m distance" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to create: $($user.name)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "SUCCESS! Everything is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: vercel --prod" -ForegroundColor Cyan
