// app.js
const express = require("express");
const app = express();
const path = require("node:path");
const usersRouter = require("./routes/usersRouter");
app.use(express.static(path.join(__dirname, "public"))); // to be able to insert CSS
app.use(express.urlencoded({ extended: true })); // is the middleware that parses application/x-www-form-urlencoded form data into req.body

app.set("views", path.join(__dirname, "views")); // rmmber the include path willbe alays form views
app.set("view engine", "ejs");



app.use("/", usersRouter);



const PORT = process.env.PORT || 3000;
app.listen(PORT, (error) =>{
    if(error){
        throw error;
    }
    console.log(`Express app listenting on port ${PORT}`);
})
