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
public class HomePage {

    private WebDriver driver;

    //Page URL
    private static String PAGE_URL = "https://www.edgewordstraining.co.uk/demo-site/";

    @FindBy(how = How.CSS, using = "#masthead [type='search']")
    private WebElement searchBox;

    public HomePage(WebDriver driver) {
        this.driver = driver;
        //Initialise Elements
        PageFactory.initElements(driver,this);
        driver.get(PAGE_URL);
        driver.manage().window().maximize();
    }

    public void searchItem(String item){
        searchBox.sendKeys(item);
        searchBox.sendKeys(Keys.ENTER);
    }

}
