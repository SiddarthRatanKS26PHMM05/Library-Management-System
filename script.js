const registerForm = document.getElementById("registerForm");
const bookForm = document.getElementById("bookForm");

if (registerForm) {
  const message = document.getElementById("message");

  registerForm.addEventListener("submit", async event => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();

    if (name.length < 3) {
      message.textContent = "Name must be at least 3 characters.";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.textContent = "Enter a valid email address.";
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });

      const data = await response.json();
      message.textContent = data.message;

      if (response.ok) {
        sessionStorage.setItem("libraryMember", JSON.stringify(data.member));
        window.location.href = "/library.html";
      }
    } catch (error) {
      message.textContent = "Unable to connect to the server.";
    }
  });
}

if (bookForm) {
  let editingId = null;
  const rows = document.getElementById("bookRows");
  const bookMessage = document.getElementById("bookMessage");
  const search = document.getElementById("search");

  async function loadBooks() {
    try {
      const response = await fetch("/api/books?search=" + encodeURIComponent(search.value.trim()));
      const books = await response.json();
      rows.innerHTML = "";

      if (!response.ok) {
        bookMessage.textContent = books.message || "Could not load books.";
        return;
      }

      if (books.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.textContent = "No records found.";
        row.appendChild(cell);
        rows.appendChild(row);
        return;
      }

      books.forEach(book => {
        const row = document.createElement("tr");
        [book.title, book.author, book.category, String(book.quantity)].forEach(value => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });

        const actions = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editBook(book));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-button secondary";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteBook(book._id));

        actions.append(editButton, deleteButton);
        row.appendChild(actions);
        rows.appendChild(row);
      });
    } catch (error) {
      bookMessage.textContent = "Unable to connect to the server.";
    }
  }

  function resetForm() {
    editingId = null;
    bookForm.reset();
    document.getElementById("quantity").value = 1;
    document.getElementById("formTitle").textContent = "Add Book";
    document.getElementById("saveButton").textContent = "Add Book";
    document.getElementById("cancelButton").hidden = true;
  }

  function editBook(book) {
    editingId = book._id;
    document.getElementById("title").value = book.title;
    document.getElementById("author").value = book.author;
    document.getElementById("category").value = book.category;
    document.getElementById("quantity").value = book.quantity;
    document.getElementById("formTitle").textContent = "Update Book";
    document.getElementById("saveButton").textContent = "Update Book";
    document.getElementById("cancelButton").hidden = false;
    document.getElementById("formSection").scrollIntoView({ behavior: "smooth" });
  }

  async function deleteBook(id) {
    if (!window.confirm("Delete this book record?")) return;

    try {
      const response = await fetch("/api/books/" + id, { method: "DELETE" });
      const data = await response.json();
      bookMessage.textContent = data.message;
      if (response.ok) loadBooks();
    } catch (error) {
      bookMessage.textContent = "Unable to connect to the server.";
    }
  }

  bookForm.addEventListener("submit", async event => {
    event.preventDefault();

    const book = {
      title: document.getElementById("title").value.trim(),
      author: document.getElementById("author").value.trim(),
      category: document.getElementById("category").value.trim(),
      quantity: document.getElementById("quantity").value
    };

    if (!book.title || !book.author || !book.category || book.quantity === "" || !Number.isInteger(Number(book.quantity)) || Number(book.quantity) < 0) {
      bookMessage.textContent = "Enter valid book details and a non-negative whole-number quantity.";
      return;
    }

    const url = editingId ? "/api/books/" + editingId : "/api/books";
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book)
      });

      const data = await response.json();
      bookMessage.textContent = data.message;

      if (response.ok) {
        resetForm();
        loadBooks();
      }
    } catch (error) {
      bookMessage.textContent = "Unable to connect to the server.";
    }
  });

  document.getElementById("cancelButton").addEventListener("click", resetForm);
  document.getElementById("addSectionButton").addEventListener("click", () => {
    document.getElementById("formSection").scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("recordsSectionButton").addEventListener("click", () => {
    document.getElementById("recordsSection").scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem("libraryMember");
    window.location.href = "/";
  });
  search.addEventListener("input", loadBooks);

  loadBooks();
}
