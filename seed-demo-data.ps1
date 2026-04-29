# seed-demo-data.ps1
# Run this after starting the Spring Boot service locally:
#   $env:KAFKA_ENABLED="false"; $env:PRICING_COOLDOWN_SECONDS="5"
#   mvn spring-boot:run (in product-catalog-service dir)
#
# Then in a new terminal from the project root:
#   .\seed-demo-data.ps1

$BASE = "http://localhost:8080/api/products"
$EVENTS = @(
    "COMPETITOR_PRICE_DROP", "COMPETITOR_PRICE_SURGE",
    "SOCIAL_TREND_POSITIVE", "SOCIAL_TREND_NEGATIVE",
    "REVIEW_SURGE_POSITIVE", "REVIEW_SURGE_NEGATIVE",
    "NEWS_POSITIVE",         "NEWS_NEGATIVE"
)

function Post-Json($uri, $body) {
    Invoke-RestMethod -Method POST -Uri $uri `
        -ContentType "application/json" `
        -Body ($body | ConvertTo-Json)
}

Write-Host "`n=== Creating 3 seed products ===" -ForegroundColor Cyan

$headphones = Post-Json $BASE @{
    name        = "ANC Wireless Headphones"
    description = "Premium noise-cancelling wireless headphones with 30hr battery life"
    category    = "Audio"
    basePrice   = 199.99
    inventory   = 450
    tags        = @("headphones","anc","audio","wireless")
}
Write-Host "Created: $($headphones.name)  ID: $($headphones.productId)" -ForegroundColor Green

$gpu = Post-Json $BASE @{
    name        = "Gaming GPU RTX 5090"
    description = "Flagship GPU - 32GB GDDR7 for 4K gaming and AI workloads"
    category    = "GPU"
    basePrice   = 1999.99
    inventory   = 87
    tags        = @("gpu","gaming","nvidia","graphics")
}
Write-Host "Created: $($gpu.name)  ID: $($gpu.productId)" -ForegroundColor Green

$keyboard = Post-Json $BASE @{
    name        = "Mechanical Keyboard TKL Pro"
    description = "Tenkeyless mechanical keyboard with hot-swap switches and RGB backlighting"
    category    = "Peripherals"
    basePrice   = 149.99
    inventory   = 320
    tags        = @("keyboard","mechanical","tkl","rgb")
}
Write-Host "Created: $($keyboard.name)  ID: $($keyboard.productId)" -ForegroundColor Green

$products = @(
    @{ name = $headphones.name; id = $headphones.productId },
    @{ name = $gpu.name;        id = $gpu.productId        },
    @{ name = $keyboard.name;   id = $keyboard.productId   }
)

Write-Host "`n=== Generating audit history (8 events per product = 24 entries) ===" -ForegroundColor Cyan
Write-Host "Waiting 6s between each trigger (cooldown = 5s)..." -ForegroundColor Yellow

foreach ($product in $products) {
    Write-Host "`n--- $($product.name) ---" -ForegroundColor Magenta
    foreach ($event in $EVENTS) {
        try {
            $result = Post-Json "$BASE/$($product.id)/demo/trigger" @{ eventType = $event }
            Write-Host "  $event -> `$$($result.currentPrice) (x$($result.priceMultiplier))" -ForegroundColor White
        } catch {
            Write-Host "  $event -> SKIPPED (cooldown or error)" -ForegroundColor DarkYellow
        }
        Start-Sleep -Seconds 6
    }
}

Write-Host "`n=== DONE - copy these IDs into src/lib/constants.ts ===" -ForegroundColor Cyan
Write-Host "headphones: '$($headphones.productId)'" -ForegroundColor Yellow
Write-Host "gpu:        '$($gpu.productId)'" -ForegroundColor Yellow
Write-Host "keyboard:   '$($keyboard.productId)'" -ForegroundColor Yellow
Write-Host "`nNext: mongodump --uri=`"mongodb://localhost:27017/pricing_db`" --out=./mongo-seed-dump" -ForegroundColor Cyan
