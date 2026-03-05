from playwright.sync_api import sync_playwright, expect
import time

def verify_registration_ui(page):
    # Go to login page first to check the link
    print("Navigating to login page...")
    page.goto("http://localhost:3000/login")

    # Check for "Criar Nova Organização" link
    register_link = page.get_by_role("link", name="Criar Nova Organização")
    expect(register_link).to_be_visible()
    print("Register link found on login page.")

    # Click and verify navigation to /registo
    register_link.click()

    # Increase timeout and print current URL if fails
    try:
        expect(page).to_have_url("http://localhost:3000/registo", timeout=10000)
        print("Navigated to /registo successfully.")
    except Exception as e:
        print(f"URL mismatch. Current URL: {page.url}")
        page.screenshot(path="/home/jules/verification/url_error.png")
        raise e

    # Verify elements on registration page
    expect(page.get_by_text("Dados da Empresa")).to_be_visible()
    expect(page.get_by_text("Dados do Administrador")).to_be_visible()

    # Take screenshot
    page.screenshot(path="/home/jules/verification/registo_page.png")
    print("Screenshot saved to /home/jules/verification/registo_page.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_registration_ui(page)
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()
