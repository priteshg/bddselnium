package pages;

import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.How;
import org.openqa.selenium.support.PageFactory;

/**
 * Created by Pritesh on 23/10/2019.
 */
public class SearchResultsPage {

    private WebDriver driver;

    //Page URL

    @FindBy(how = How.LINK_TEXT, using = "Edgewords Shop")
    private WebElement heading;

    @FindBy(how = How.NAME, using = "add-to-cart")
    private WebElement searchBox;

    public SearchResultsPage(WebDriver driver) {
        this.driver = driver;
        //Initialise Elements
        PageFactory.initElements(driver,this);
    }

    public void addToCart(){
        searchBox.click();
    }

    public boolean isPageOpened() {
        return heading.isDisplayed();
    }
}
