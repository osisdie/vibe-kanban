"""
E2E tests for whereis-ticket using Playwright MCP.

These tests are designed to be run via the Playwright MCP browser tools.
They test two scenarios:
  1. Single task lifecycle: create -> move through columns -> done
  2. Multi-task ordered workflow: multiple tasks with sequential status transitions

Prerequisites:
  - Backend running at http://localhost:8004
  - Frontend running at http://localhost:5173
"""

# Test Plan (for MCP Playwright execution):
#
# === Test 1: Single Task Lifecycle ===
# 1. Navigate to http://localhost:5173/register
# 2. Fill register form: name="E2E Tester", email="e2e@test.com", password="test1234"
# 3. Click "Create Account"
# 4. Should redirect to /settings
# 5. Create project: name="E2E Test Project"
# 6. Click on the project name to go to the board
# 7. Click "+" on the TODO column
# 8. Create ticket: title="Setup database", priority=high
# 9. Verify ticket appears in TODO column
# 10. Drag ticket to "Doing" column (or use API)
# 11. Verify ticket is in "Doing" column
# 12. Drag to "Testing" -> verify
# 13. Drag to "Done" -> verify
# 14. Click on ticket to open modal -> verify status change comments exist
#
# === Test 2: Multi-Task Ordered Workflow ===
# 1. Create 3 tickets in TODO: "Task A", "Task B", "Task C"
# 2. Move "Task A" to Doing
# 3. Move "Task B" to Doing
# 4. Move "Task A" to Pending Confirming (waiting for approval)
# 5. Add comment on Task A: "Waiting for manager approval"
# 6. Move "Task A" to Doing (approved)
# 7. Move "Task A" to Testing
# 8. Move "Task B" to Testing
# 9. Move "Task A" to Done
# 10. Verify final state: Task A=Done, Task B=Testing, Task C=TODO
# 11. Verify Task A has full audit trail in comments

import httpx
import asyncio

BASE = "http://localhost:8004/api/v1"


async def run_api_e2e_tests():
    """Run E2E tests via the API (can also be driven by Playwright MCP for UI)."""
    async with httpx.AsyncClient(base_url=BASE) as client:
        print("=" * 60)
        print("Test 1: Single Task Lifecycle")
        print("=" * 60)

        # Register
        resp = await client.post("/auth/register", json={
            "email": "e2e-single@test.com",
            "password": "test1234",
            "display_name": "E2E Single Tester",
        })
        assert resp.status_code == 200, f"Register failed: {resp.text}"
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("[PASS] Registration")

        # Create API Key / Project
        resp = await client.post("/api-keys", json={"name": "Single Task Project"}, headers=headers)
        assert resp.status_code == 201
        ak = resp.json()
        ak_id = ak["id"]
        api_key = ak["key"]
        print(f"[PASS] Created project: {ak['name']} (id={ak_id})")

        # Create ticket
        resp = await client.post(f"/api-keys/{ak_id}/tickets", json={
            "title": "Setup database",
            "priority": "high",
        }, headers=headers)
        assert resp.status_code == 201
        ticket = resp.json()
        tid = ticket["id"]
        assert ticket["status"] == "todo"
        print(f"[PASS] Created ticket: {ticket['title']} (status=todo)")

        # Move through columns: todo -> doing -> testing -> done
        for new_status in ["doing", "testing", "done"]:
            resp = await client.patch(f"/tickets/{tid}/move", json={"status": new_status}, headers=headers)
            assert resp.status_code == 200
            assert resp.json()["status"] == new_status
            print(f"[PASS] Moved to: {new_status}")

        # Verify audit trail
        resp = await client.get(f"/tickets/{tid}", headers=headers)
        assert resp.status_code == 200
        comments = resp.json()["comments"]
        status_changes = [c for c in comments if c["is_status_change"]]
        assert len(status_changes) == 3, f"Expected 3 status changes, got {len(status_changes)}"
        print(f"[PASS] Audit trail: {len(status_changes)} status change comments")

        print("\n" + "=" * 60)
        print("Test 2: Multi-Task Ordered Workflow")
        print("=" * 60)

        # Register new user
        resp = await client.post("/auth/register", json={
            "email": "e2e-multi@test.com",
            "password": "test1234",
            "display_name": "E2E Multi Tester",
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create project
        resp = await client.post("/api-keys", json={"name": "Multi Task Project"}, headers=headers)
        ak_id = resp.json()["id"]
        api_key = resp.json()["key"]
        ext_headers = {"X-API-Key": api_key}

        # Create 3 tickets via external API (simulating an agent)
        tasks = {}
        for name in ["Task A", "Task B", "Task C"]:
            resp = await client.post("/external/tickets", json={
                "title": name,
                "external_ref": name.lower().replace(" ", "-"),
            }, headers=ext_headers)
            assert resp.status_code == 201
            tasks[name] = resp.json()["id"]
        print(f"[PASS] Created 3 tickets: {list(tasks.keys())}")

        # Move Task A and B to Doing
        for name in ["Task A", "Task B"]:
            resp = await client.patch(f"/external/tickets/{tasks[name]}/move",
                json={"status": "doing"}, headers=ext_headers)
            assert resp.status_code == 200
        print("[PASS] Task A, Task B -> Doing")

        # Move Task A to Pending Confirming
        resp = await client.patch(f"/external/tickets/{tasks['Task A']}/move",
            json={"status": "pending_confirming"}, headers=ext_headers)
        assert resp.status_code == 200
        print("[PASS] Task A -> Pending Confirming")

        # Add comment on Task A
        resp = await client.post(f"/external/tickets/{tasks['Task A']}/comments",
            json={"content": "Waiting for manager approval"}, headers=ext_headers)
        assert resp.status_code == 200
        print("[PASS] Added comment on Task A")

        # Task A approved, back to Doing
        resp = await client.patch(f"/external/tickets/{tasks['Task A']}/move",
            json={"status": "doing"}, headers=ext_headers)
        assert resp.status_code == 200
        print("[PASS] Task A -> Doing (approved)")

        # Task A -> Testing, Task B -> Testing
        for name in ["Task A", "Task B"]:
            await client.patch(f"/external/tickets/{tasks[name]}/move",
                json={"status": "testing"}, headers=ext_headers)
        print("[PASS] Task A, Task B -> Testing")

        # Task A -> Done
        await client.patch(f"/external/tickets/{tasks['Task A']}/move",
            json={"status": "done"}, headers=ext_headers)
        print("[PASS] Task A -> Done")

        # Verify final state
        resp = await client.get("/external/tickets", headers=ext_headers)
        all_tickets = {t["title"]: t["status"] for t in resp.json()}
        assert all_tickets["Task A"] == "done"
        assert all_tickets["Task B"] == "testing"
        assert all_tickets["Task C"] == "todo"
        print(f"[PASS] Final state verified: {all_tickets}")

        # Verify Task A full audit trail
        resp = await client.get(f"/external/tickets/{tasks['Task A']}", headers=ext_headers)
        comments = resp.json()["comments"]
        status_changes = [c for c in comments if c["is_status_change"]]
        non_status = [c for c in comments if not c["is_status_change"]]
        assert len(status_changes) == 5  # todo->doing, doing->pending, pending->doing, doing->testing, testing->done
        print(f"[PASS] Task A audit trail: {len(status_changes)} status changes, {len(non_status)} manual comments")

        # Check usage
        resp = await client.get("/external/usage", headers=ext_headers)
        usage = resp.json()
        print(f"[PASS] API usage: {usage['usage_count']}/1000 ({usage['remaining']} remaining)")

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_api_e2e_tests())
