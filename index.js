import express, { response } from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import axios from 'axios';

const app = express();
const port = 3000;
const API_URL = "https://openlibrary.org/";


const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "books",
    password: "S@ntos9403",
    port: 5432,
  });
  db.connect();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

let books = [];
let currentUserId = 1;

  
async function getBooks() {
    const result = await db.query("SELECT * FROM databooks");
    return result.rows;
};

async function readBook(title, cover, author, notes, user_id) {
    const result = await db.query("INSERT INTO databooks  VALUES ($1,$2,$3,$4)", [title, cover, author,notes, user_id]);
    return result;
};


async function getUsers() {
    const result = await db.query("SELECT name, id FROM users");
    let users = [];
    result.rows.forEach((user) => {
      users.push(user);
    });
    console.log(users);
    return users;
  }


app.get("/", async (req, res) => {
const users = await getUsers();
res.render("index.ejs", {
   books: books,
    users: users,
    route: "home",
   
});  
});

app.get('/user', async (req, res) => {
    const users = await getUsers();
    const userId = req.query.userId;
    currentUserId = userId;
    console.log(currentUserId);
    

    if (currentUserId == 'addUser') {

        res.render("newUser.ejs");
            
    } else {
    const response = await db.query("SELECT * FROM databooks WHERE user_id = $1", [userId]);
    res.render("index.ejs", {

        books: response.rows,
        users: users,
        route: "user",
    });  
};
});

app.post("/addUser", async (req, res) => {
    const name = req.body.name;
    const secondName = req.body.secondName;
    const response = await db.query("INSERT INTO users (name, secondname) VALUES ($1,$2)", [name, secondName]);
    console.log("User added to database");
    res.redirect("/");
});

app.get("/books", async (req, res) => {
    const users = await getUsers();
    const bookName = req.query.books;
    const response = await axios.get(API_URL + "search.json?q="+bookName+"&fields=title,author_name,cover_edition_key,key&limit=10");
   
    res.render("index.ejs", {
        books: response.data.docs,
        users: users,
        userId: currentUserId,
        route: "books",

    }
    );
    console.log(response.data.docs); 
   
});




app.post("/addBook", async (req, res) => {
    let book = req.body.addBook;
    let addBook = book.split(",");
    let title = addBook[0];
    let cover = addBook[1];
    let author = addBook[2];


    
    res.render("bookReview.ejs", { 
        title: title,
        cover: cover,
        author: author,
        userId: currentUserId,
        
 });
 console.log(currentUserId);
});

 app.post("/addReview", async (req, res) => {
    let review = req.body

    const response = await db.query("INSERT INTO databooks (title, author, cover,notes, user_id)  VALUES ($1,$2,$3,$4,$5)", [review.title, review.author, review.cover, review.review, currentUserId]);

    console.log("Review added to database");
   
   
    res.redirect("/user?userId=" + currentUserId);


   
});

app.post("/deleteBook", async (req, res) => {  
    let book = req.body.deleteBook;
    let deleteBook = book.split(",");
    let title = deleteBook[0];
    let cover = deleteBook[1];
    let author = deleteBook[2];
    console.log(title, cover, author);
    const response = await db.query("DELETE FROM databooks WHERE title = ($1) AND author = ($2) AND cover = ($3) AND user_id= ($4)", [title, author, cover, currentUserId]);
    console.log("Book deleted from database");
    res.redirect("/user?userId=" + currentUserId);
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    });
