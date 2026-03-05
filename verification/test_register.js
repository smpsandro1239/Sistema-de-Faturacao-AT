const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Testing Registration Page UI...');
    await page.goto('http://localhost:3000/registo');

    // Check if the page title is correct
    const title = await page.innerText('h3.font-bold:has-text("Dados da Empresa")');
    console.log('Found section:', title);

    const adminSection = await page.innerText('h3.font-bold:has-text("Dados do Administrador")');
    console.log('Found section:', adminSection);

    // Check for form fields
    const nifField = await page.isVisible('input#org-nif');
    const emailField = await page.isVisible('input#admin-email');
    console.log('Form fields visible:', { nifField, emailField });

    if (!nifField || !emailField) {
      throw new Error('Registration fields are not visible');
    }

    await page.screenshot({ path: 'verification/register_page.png' });
    console.log('Screenshot saved to verification/register_page.png');

    // Test API Route Existence
    console.log('Testing API Route...');
    const apiRes = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/auth/register-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresa: { nome: 'Test Org', nif: '123456789', morada: 'Test Street', codigoPostal: '1234-123', localidade: 'Test City' },
            admin: { nome: 'Admin User', email: 'admin-test@example.com', password: 'password123' }
          })
        });
        const data = await res.json();
        return { status: res.status, data };
      } catch (err) {
        return { error: err.message };
      }
    });

    console.log('API Response status:', apiRes.status);
    console.log('API Response data:', JSON.stringify(apiRes.data));

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
