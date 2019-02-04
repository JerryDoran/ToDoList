//jshint esversion: 6
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// 1. npm init -> will initialize the app.js file

// Need to require the npm packages that were installed from command line
// 2. install express body-paser -> type this at command license
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// Get an instance of the sever
const app = express();

app.use(bodyParser.urlencoded({extended: true}));

//Tells our app to use any static files in the public folder
app.use(express.static("public"));

// Tells our app to use ejs as its view engine.
app.set("view engine", "ejs");

// Connect to the MongoDB database
// mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

mongoose.connect("mongodb+srv://admin-jerry:carmel101@cluster0-yclv3.mongodb.net/todolistDB", {useNewUrlParser: true});



// Create the items schema
const itemsSchema = new mongoose.Schema({
  name: String
});

// Create mongoose model
const Item = mongoose.model("Item", itemsSchema);

// Add some default list items.
const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

// For every new list that we create it will be given a name and have an array of item
// documents associated with it as well.
const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
});

// will create a new collection/table called 'lists'
const List = mongoose.model("List", listSchema);

// Set up the get route to our home page.
// The server will route to our home page and send a response to our browser.
app.get("/", function(req, res) {
  // process some logic on our server and sent the result back to the browser

  // we will get an array back using 'find' method
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added default items!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // we will get an object back usind findOne method
  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customListName);

      } else {
        // Show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
})

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  // Create a new database document
  const item = new Item ({
    name: itemName
  });

  // Check if item added to default list 'Today'
  if (listName === "Today") {
    // Save the item into my collection items.
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Succesfully deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server is running on port 3000");
});
