import json
import urllib.error
import urllib.request


def req(method, path, token=None, body=None):
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request("http://127.0.0.1:8000" + path, data=data, method=method)
    request.add_header("Accept", "application/json")
    if body is not None:
        request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, response.read().decode()
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode()


def show(code, path, text):
    snippet = text[:220].replace("\n", " ")
    print(f"{code} {path} {snippet}")


code, text = req("POST", "/api/auth/login", body={"email": "citizen@gmail.com", "password": "Citizen123"})
show(code, "login", text)
token = json.loads(text)["access_token"]

paths = [
    "/api/health",
    "/api/neighborhoods",
    "/api/auth/me",
    "/api/admin/access",
    "/api/reports/categories",
    "/api/reports",
    "/api/reports?status_filter=submitted",
    "/api/reports?priority=high",
    "/api/reports?search=road",
    "/api/reports?mine=true",
    "/api/reports/stats",
    "/api/reports/community",
    "/api/reports/notifications",
    "/api/reports/achievements",
    "/api/reports/neighborhood-health",
    "/api/reports/duplicates?latitude=42.66&longitude=21.16&category_id=1",
]
categories = json.loads(req("GET", "/api/reports/categories", token)[1])
if categories:
    paths.append("/api/reports?category=" + categories[0]["slug"])

reports_code, reports_text = req("GET", "/api/reports", token)
reports = json.loads(reports_text) if reports_code == 200 else []
print("report count", len(reports) if isinstance(reports, list) else reports_text[:200])
report_id = reports[0]["id"] if reports else 1
paths.extend(
    [
        f"/api/reports/{report_id}",
        f"/api/reports/{report_id}/comments",
        f"/api/reports/{report_id}/history",
    ]
)
for path in paths:
    show(*req("GET", path, token), path) if False else show(*((lambda c, t: (c, path, t))(*req("GET", path, token))))

show(*((lambda c, t: (c, "vote", t))(*req("POST", f"/api/reports/{report_id}/vote", token))))
show(*((lambda c, t: (c, "comment", t))(*req("POST", f"/api/reports/{report_id}/comments", token, {"body": "Looks bad"}))))
notes = json.loads(req("GET", "/api/reports/notifications", token)[1])
if notes:
    show(*((lambda c, t: (c, "read one", t))(*req("POST", f"/api/reports/notifications/{notes[0]['id']}/read", token))))
show(*((lambda c, t: (c, "read all", t))(*req("POST", "/api/reports/notifications/read-all", token))))

_, admin_text = req("POST", "/api/auth/login", body={"email": "admin@gmail.com", "password": "Admin123"})
admin_token = json.loads(admin_text)["access_token"]
show(*((lambda c, t: (c, "admin access", t))(*req("GET", "/api/admin/access", admin_token))))
show(*((lambda c, t: (c, "worker login", t))(*req("POST", "/api/auth/login", body={"email": "worker@gmail.com", "password": "Worker123"}))))
