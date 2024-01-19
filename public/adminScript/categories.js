function addCategory() {
    event.preventDefault();
    var categoryInput = document.getElementById("categoryName");
    var categoryName = categoryInput.value.trim();

    if (categoryName !== "") {
      fetch('/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: categoryName }),
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        // Update the frontend if the backend operation was successful
        if (data.success) {
          var listItem = document.createElement("li");
          listItem.innerHTML = `
            <span>${categoryName}</span>
            <div class="action-buttons">
              <button class="edit-button" onclick="handleEdit('${categoryName}')">Edit</button>
              <button class="unlist-button" onclick="handleUnlist('${categoryName}')">Unlist</button>
            </div>
          `;

          var categoryList = document.getElementById("categoryList");
          categoryList.appendChild(listItem);

          // Clear the input field
          categoryInput.value = "";
          fetchAndRenderCategories();
        } else{
          if (data.error=== 'Category already exists') {
            Swal.fire({
              icon: 'error',
              title: 'Category already exists',
              text: 'Please enter a new category.',
            });
        }
        console.log(data.error)
      }
      }).catch(error => {
        console.error('Error:', error);
      });
    }
  }

  document.querySelectorAll('.unlist-button').forEach((button) => {
    button.addEventListener('click', () => {
        let id = button.getAttribute('data-category-id');
        console.log(id);
        let currentState = button.getAttribute('data-state')
        console.log(currentState);
        let url;

        if (currentState == 'false') {
            url = `/admin/list-category/${id}`

        } else {
            url = `/admin/unlist-category/${id}`
        }
        fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            return response.json();
        }).then(data => {
            if (data.message) {
                if (currentState == 'false') {
                    button.setAttribute('data-state', 'true')
                    button.textContent = 'UnList'
                    button.classList.replace('btn-danger', 'btn-success')

                } else {
                    button.setAttribute('data-state', 'false')
                    button.textContent = 'List'
                    button.classList.replace('btn-success', 'btn-danger')

                }

            }
        }).catch(error => {
            console.log(error);
        })

    })
})