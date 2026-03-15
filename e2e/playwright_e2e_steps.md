# Playwright MCP E2E Test Steps

These steps are designed to be executed via Playwright MCP browser tools.

## Prerequisites
- Backend: `cd backend && uvicorn app.main:app --reload --port 8004`
- Frontend: `cd frontend && npm run dev`

---

## Test 1: Single Task Lifecycle

### Setup
1. `browser_navigate` to `http://localhost:5177/register`
2. `browser_snapshot` to verify the registration form is visible

### Register
3. `browser_fill_form` with:
   - Display Name: "E2E Tester"
   - Email: "e2e@test.com"
   - Password: "test1234"
4. `browser_click` on "Create Account" button
5. `browser_snapshot` — should be on `/settings` page

### Create Project
6. `browser_fill_form` — type "E2E Project" in the project name input
7. `browser_click` on "Create Project" button
8. `browser_snapshot` — should see the project listed

### Open Board
9. `browser_click` on "E2E Project" link
10. `browser_snapshot` — should see 5 Kanban columns

### Create Ticket
11. `browser_click` on "+" in the TODO column
12. `browser_fill_form` with:
    - Title: "Setup database"
    - Description: "Configure PostgreSQL"
    - Priority: "high"
13. `browser_click` on "Create" button
14. `browser_snapshot` — ticket should appear in TODO column

### View Ticket + Comments
15. `browser_click` on the "Setup database" ticket card
16. `browser_snapshot` — modal should show ticket details
17. `browser_fill_form` — type "Starting work on this" in comment input
18. `browser_click` on "Send" button
19. `browser_snapshot` — comment should appear in the comment list

### Close and verify
20. `browser_click` on the close (×) button
21. `browser_take_screenshot` filename=".playwright-mcp/test1-complete.png"

---

## Test 2: Multi-Task Ordered Workflow

### Create Multiple Tickets
1. Click "+" on TODO column, create "Task A" (high priority)
2. Click "+" on TODO column, create "Task B" (medium priority)
3. Click "+" on TODO column, create "Task C" (low priority)
4. `browser_snapshot` — all 3 tickets visible in TODO

### Verify Board State
5. `browser_take_screenshot` filename=".playwright-mcp/test2-initial.png"

### Interact with Tickets
6. Click on "Task A" to open modal
7. Add comment: "This is the first priority"
8. Close modal
9. Click on "Task B" to open modal
10. Add comment: "Will start after Task A"
11. Close modal

### Final screenshot
12. `browser_take_screenshot` filename=".playwright-mcp/test2-complete.png"

---

## Verification Checklist
- [ ] Registration flow works
- [ ] Login flow works
- [ ] Project creation with API key generation works
- [ ] Kanban board displays 5 columns
- [ ] Ticket creation works from the "+" button
- [ ] Ticket modal shows details and comments
- [ ] Comments can be added and display timestamps
- [ ] Status change comments appear automatically (italic style)
- [ ] Multiple tickets can coexist on the board
