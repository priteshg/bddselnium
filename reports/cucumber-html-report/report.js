$(document).ready(function() {var formatter = new CucumberHTML.DOMFormatter($('.cucumber-report'));formatter.uri("basket.feature");
formatter.feature({
  "line": 2,
  "name": "basket",
  "description": "",
  "id": "basket",
  "keyword": "Feature",
  "tags": [
    {
      "line": 1,
      "name": "@run"
    }
  ]
});
formatter.scenario({
  "comments": [
    {
      "line": 3,
      "value": "#shopping basket features"
    }
  ],
  "line": 5,
  "name": "add to basket",
  "description": "",
  "id": "basket;add-to-basket",
  "type": "scenario",
  "keyword": "Scenario"
});
formatter.step({
  "line": 6,
  "name": "that i am on the shopping website",
  "keyword": "Given "
});
formatter.step({
  "line": 7,
  "name": "i add an item to the basket",
  "keyword": "When "
});
formatter.step({
  "line": 8,
  "name": "i can view the item in my basket",
  "keyword": "Then "
});
formatter.match({
  "location": "Basket.that_i_am_on_the_shopping_website()"
});
formatter.result({
  "duration": 4330422133,
  "status": "passed"
});
formatter.match({
  "location": "Basket.i_add_an_item_to_the_basket()"
});
formatter.result({
  "duration": 2973043074,
  "status": "passed"
});
formatter.match({
  "location": "Basket.i_can_view_the_item_in_my_basket()"
});
formatter.result({
  "duration": 4040701324,
  "status": "passed"
});
});