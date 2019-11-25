package bindings;

import cucumber.api.java.en.Given;
import cucumber.api.java.en.Then;
import cucumber.api.java.en.When;
import org.junit.Assert;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import pages.HomePage;
import pages.SearchResultsPage;

import java.util.concurrent.TimeUnit;

import static org.junit.Assert.assertTrue;

/**
 * Created by Pritesh on 22/10/2019.
 */
public class Basket {
    private WebDriver driver;
    private HomePage homePage;


    @Given("^that i am on the shopping website$")
    public void that_i_am_on_the_shopping_website() throws Throwable {
        driver = new ChromeDriver();
        driver.manage().timeouts().implicitlyWait(15, TimeUnit.SECONDS);
        homePage = new HomePage(driver);

    }

    @When("^i add an item to the basket$")
    public void i_add_an_item_to_the_basket() throws Throwable {
        homePage.searchItem("Cap");
        SearchResultsPage searchResultsPage = new SearchResultsPage(driver);
        Assert.assertTrue(searchResultsPage.isPageOpened());
        searchResultsPage.addToCart();
    }

    @Then("^i can view the item in my basket$")
    public void i_can_view_the_item_in_my_basket() throws Throwable {
        driver.findElement(By.linkText("Cart")).click();
        assertTrue(driver.findElement(By.linkText("Cap")).isDisplayed());
        driver.findElement(By.linkText("×")).click();
        // explicit wait for item to be removed as may use AJAX
        WebDriverWait wait=new WebDriverWait(driver, 20); //explicit wait if we want to use
        WebElement returnToShopLink;
        returnToShopLink= wait.until(ExpectedConditions.visibilityOfElementLocated(By.linkText("Return to shop")));
        returnToShopLink.click();
        //driver.findElement(By.linkText("Return to shop")).click();
        driver.quit();
    }

}
