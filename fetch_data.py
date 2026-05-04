import urllib.request
import urllib.parse
import json
import csv
from io import StringIO

url = "http://192.168.1.49:8086/api/v2/query?org=Linders"
token = "NfOEXVfcC64gwwvhjVk3QISbzMEUtg8CrfF7SUFNeTRAHO_G85AWp_du64lEZJHxAlSNM9eScBulKAnuw9--0w=="

headers = {
    "Authorization": f"Token {token}",
    "Content-Type": "application/vnd.flux",
    "Accept": "application/csv"
}

query = '''
from(bucket: "home_assistant")
  |> range(start: -10m)
  |> filter(fn: (r) => r._measurement == "W" and r._field == "value")
  |> filter(fn: (r) => 
      r.friendly_name == "SolarLog AC-Leistung" or 
      r.friendly_name == "Leistung Netzbezug" or 
      r.friendly_name == "SolarLog AC-Verbrauch" or 
      r.friendly_name == "go-eCharger 294090 Power from grid (from ids)" or
      r.friendly_name == "Rückspeisung W"
  )
  |> last()
'''

try:
    req = urllib.request.Request(url, data=query.encode('utf-8'), headers=headers, method='POST')
    res = urllib.request.urlopen(req, timeout=5)
    csv_data = res.read().decode('utf-8')
    reader = csv.DictReader(StringIO(csv_data))
    results = {}
    for row in reader:
        if 'friendly_name' in row and '_value' in row:
            results[row['friendly_name']] = float(row['_value'])
    print(json.dumps(results, indent=2))
except Exception as e:
    print(f"Error: {e}")
