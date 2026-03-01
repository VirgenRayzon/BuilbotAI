import time
import sys
from pathlib import Path
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
import undetected_chromedriver as uc

def scrape_notebooks():
    print("Starting browser locally...")
    options = uc.ChromeOptions()
    profile_path = Path("./chrome_profile_notebooklm").absolute()
    options.add_argument(f"--user-data-dir={profile_path}")
    options.add_argument("--no-first-run")
    options.add_argument("--no-default-browser-check")
    
    try:
        driver = uc.Chrome(options=options, version_main=145)
        print("Navigating to https://notebooklm.google.com/ ...")
        driver.get("https://notebooklm.google.com/")
        
        # Wait up to 15 seconds to see where we land
        WebDriverWait(driver, 15).until(
            lambda d: d.current_url != "" and d.current_url != "about:blank"
        )
        time.sleep(3)
        
        if "signin" in driver.current_url or "accounts.google.com" in driver.current_url:
            print("LOGIN_REQUIRED")
            print(">>> PLEASE LOG IN TO YOUR GOOGLE ACCOUNT IN THE BROWSER WINDOW THAT JUST OPENED! <<<")
            sys.stdout.flush()
            
            # Wait up to 5 minutes for the user to log in
            WebDriverWait(driver, 300).until(
                lambda d: "signin" not in d.current_url and "accounts.google.com" not in d.current_url
            )
            print("Login successful! Waiting for dashboard to load...")
            time.sleep(5)
            
        print("Extracting notebooks...")
        # Save page source for debugging
        with open("tmp_page_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        
        # Notebook links are usually like /notebook/1234...
        links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/notebook/']")
        nb_list = []
        for link in links:
            url = link.get_attribute("href")
            try:
                # Some links might have an empty text or nested content, let's try getting inner text
                title = link.text.strip()
                if not title:
                    title = link.get_attribute("aria-label") or "Untitled"
                
                if "/notebook/" in url:
                    nb_id = url.split("/notebook/")[1].split("?")[0].split("/")[0]
                    # To avoid duplicates if the same link appears twice
                    if not any(n['id'] == nb_id for n in nb_list):
                        nb_list.append({"id": nb_id, "title": title, "url": url})
            except Exception:
                pass
                
        print("\n=== NOTEBOOKS ===")
        for nb in nb_list:
            # Often the title looks like "Notebook title\n..." so we replace newlines
            clean_title = nb['title'].replace('\n', ' - ')
            print(f"- {clean_title} (ID: {nb['id']})")
        print("=== END ===")
        
        driver.quit()
        print("Done.")
    except Exception as e:
        print(f"Error occurred: {e}")
        try:
            driver.quit()
        except:
            pass

if __name__ == "__main__":
    scrape_notebooks()
