"""
Automated End-to-End Verification Test for Singly Linked List C Backend & API
"""

import subprocess
import time
import urllib.request
import urllib.error
import json
import sys
import os

SERVER_EXE = os.path.join(os.path.dirname(__file__), "server.exe")
BASE_URL = "http://localhost:8080"

def wait_for_server(max_attempts=30):
    for i in range(max_attempts):
        try:
            with urllib.request.urlopen(f"{BASE_URL}/api/list", timeout=1) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.2)
    return False

def request_json(path, method="GET", payload=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=3) as resp:
        body = resp.read().decode("utf-8")
        return resp.status, json.loads(body)

def request_raw(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=3) as resp:
        return resp.status, resp.read().decode("utf-8")

def run_tests():
    print("=" * 60)
    print("RUNNING AUTOMATED END-TO-END TESTS FOR C BACKEND & FRONTEND")
    print("=" * 60)

    # Launch server process from the project root or backend folder
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    proc = subprocess.Popen([SERVER_EXE], cwd=project_root)

    try:
        print("[1/13] Waiting for C HTTP server to initialize on :8080...")
        if not wait_for_server():
            print("ERROR: C server failed to start or bind within timeout!")
            return False
        print("  -> C Server is ONLINE and accepting connections!")

        # 1. Static frontend test
        print("[2/13] Testing Static File Delivery...")
        status, html = request_raw("/")
        assert status == 200 and "Singly Linked List Implementation" in html, "Failed index.html check"
        status, css = request_raw("/style.css")
        assert status == 200 and "linked-list-chain" in css, "Failed style.css check"
        status, js = request_raw("/script.js")
        assert status == 200 and "renderLinkedList" in js, "Failed script.js check"
        print("  -> HTML, CSS, and JS successfully delivered by C server!")

        # 2. Initial List
        print("[3/13] Testing GET /api/list (Initial State)...")
        status, res = request_json("/api/list")
        assert res["success"] == True
        assert res["data"] == [10, 20, 30, 40]
        assert res["count"] == 4
        print(f"  -> Initial list verified: {res['data']}")

        # 3. Insert Beginning
        print("[4/13] Testing POST /api/insert/beginning (Value: 5)...")
        status, res = request_json("/api/insert/beginning", "POST", {"value": 5})
        assert res["success"] == True
        assert res["data"] == [5, 10, 20, 30, 40]
        print(f"  -> Success: {res['message']} | List: {res['data']}")

        # 4. Insert End
        print("[5/13] Testing POST /api/insert/end (Value: 50)...")
        status, res = request_json("/api/insert/end", "POST", {"value": 50})
        assert res["success"] == True
        assert res["data"] == [5, 10, 20, 30, 40, 50]
        print(f"  -> Success: {res['message']} | List: {res['data']}")

        # 5. Insert Position
        print("[6/13] Testing POST /api/insert/position (Value: 25, Pos: 4)...")
        status, res = request_json("/api/insert/position", "POST", {"value": 25, "position": 4})
        assert res["success"] == True
        assert res["data"] == [5, 10, 20, 25, 30, 40, 50]
        print(f"  -> Success: {res['message']} | List: {res['data']}")

        # 6. Search Element
        print("[7/13] Testing POST /api/search (Value: 25 & Value: 999)...")
        status, res = request_json("/api/search", "POST", {"value": 25})
        assert res["found"] == True
        assert res["position"] == 4
        print(f"  -> Search Hit: {res['message']}")

        status, res = request_json("/api/search", "POST", {"value": 999})
        assert res["found"] == False
        assert res["position"] == 0
        print(f"  -> Search Miss: {res['message']}")

        # 7. Count Nodes
        print("[8/13] Testing GET /api/count...")
        status, res = request_json("/api/count")
        assert res["count"] == 7
        print(f"  -> Node Count Verified: {res['count']}")

        # 8. Delete Beginning
        print("[9/13] Testing POST /api/delete/beginning...")
        status, res = request_json("/api/delete/beginning", "POST")
        assert res["success"] == True
        assert res["data"] == [10, 20, 25, 30, 40, 50]
        print(f"  -> Success: {res['message']} | List: {res['data']}")

        # 9. Delete End
        print("[10/13] Testing POST /api/delete/end...")
        status, res = request_json("/api/delete/end", "POST")
        assert res["success"] == True
        assert res["data"] == [10, 20, 25, 30, 40]
        print(f"  -> Success: {res['message']} | List: {res['data']}")

        # 10. Delete Position
        print("[11/13] Testing POST /api/delete/position (Pos: 3)...")
        status, res = request_json("/api/delete/position", "POST", {"position": 3})
        assert res["success"] == True
        assert res["data"] == [10, 20, 30, 40]
        print(f"  -> Success: {res['message']} | List: {res['data']}")

        # 11. Reverse List
        print("[12/13] Testing POST /api/reverse...")
        status, res = request_json("/api/reverse", "POST")
        assert res["success"] == True
        assert res["data"] == [40, 30, 20, 10]
        print(f"  -> Reversed List: {res['data']}")

        # 12. Clear List
        print("[13/13] Testing POST /api/clear...")
        status, res = request_json("/api/clear", "POST")
        assert res["success"] == True
        assert res["data"] == []
        assert res["count"] == 0
        print(f"  -> Cleared List: {res['data']} (Count: {res['count']})")

        print("=" * 60)
        print("ALL 13 AUTOMATED SUITE TESTS PASSED WITH 100% SUCCESS!")
        print("=" * 60)
        return True

    finally:
        print("[CLEANUP] Stopping test C server...")
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()
        print("[CLEANUP] Done.")

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
