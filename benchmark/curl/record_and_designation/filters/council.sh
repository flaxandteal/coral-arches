#!/bin/sh
. ../../config.env
. ../../record_and_designation_config.env

# --- Custom Variables ---
CORAL_BENCHMARK_ENDPOINT="/dashboard/resources?page=1&itemsPerPage=8&update=true&sortBy=resourceid&sortOrder=desc&filterBy=LA04+-+Belfast+City+Council"

# --- cURL Request with Timer ---
START=$(date +%s%3N) # milliseconds

curl -s -w "\n\nTime taken: %{time_total} seconds\n" "$CORAL_BENCHMARK_ROOT_URL$CORAL_BENCHMARK_ENDPOINT" \
  -H "Accept: */*" \
  -H "Accept-Language: en-GB,en-US;q=0.9,en;q=0.8" \
  -H "Cache-Control: no-cache" \
  -H "Connection: keep-alive" \
  -H "Pragma: no-cache" \
  -H "Referer: http://localhost:8000/plugins/dashboard" \
  -H "Sec-Fetch-Dest: empty" \
  -H "Sec-Fetch-Mode: cors" \
  -H "Sec-Fetch-Site: same-origin" \
  -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36" \
  -H 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
  -H "sec-ch-ua-mobile: ?0" \
  -H 'sec-ch-ua-platform: "Linux"' \
  -b "$CORAL_BENCHMARK_COOKIE_HEADER"

END=$(date +%s%3N)
DURATION=$((END - START))
echo "Measured time (by shell): ${DURATION} ms"