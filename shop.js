let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentItem = null;
let selectedSize = null;
let selectedQuantity = 1;
let selectedSizeButton = null;

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function openSizeQuantityModal(item) {
    currentItem = item;
    selectedSize = null;
    selectedQuantity = 1;
    document.getElementById('modal-quantity').innerText = selectedQuantity;
    const sizeQuantityModal = document.getElementById('sizeQuantityModal');
    sizeQuantityModal.style.display = 'block';
}

function closeSizeQuantityModal() {
    const sizeQuantityModal = document.getElementById('sizeQuantityModal');
    sizeQuantityModal.style.display = 'none';
    currentItem = null;
    selectedSize = null;
}

function selectSize(size) {
    selectedSize = size;

    if (selectedSizeButton) {
        selectedSizeButton.classList.remove('selected');
    }

    const buttons = document.querySelectorAll('.size-quantity-modal-content button');
    buttons.forEach(button => {
        if (button.innerText === size) {
            button.classList.add('selected');
            selectedSizeButton = button;
        }
    });

    const priceDisplay = document.querySelector('.size-quantity-modal-content .price');
    if (selectedSize === '16oz') {
        priceDisplay.innerText = '₱80';
    } else if (selectedSize === '22oz') {
        priceDisplay.innerText = '₱100';
    }
}

function increaseQuantityModal() {
    selectedQuantity += 1;
    document.getElementById('modal-quantity').innerText = selectedQuantity;
}

function decreaseQuantityModal() {
    if (selectedQuantity > 1) {
        selectedQuantity -= 1;
        document.getElementById('modal-quantity').innerText = selectedQuantity;
    }
}

function addSelectedItemToCart() {
    if (currentItem && selectedSize) {
        let price = 0;
        if (selectedSize === '16oz') {
            price = 80;
        } else if (selectedSize === '22oz') {
            price = 100;
        }
        addToCart(currentItem.name, price, currentItem.image, selectedSize, selectedQuantity);
        closeSizeQuantityModal();
    } else {
        alert('Please select a size.');
    }
}

function addToCart(name, price, image, size, quantity) {
    const item = { name, price, image, size, quantity };
    const existingItem = cart.find(cartItem => cartItem.name === name && cartItem.size === size);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push(item);
    }
    saveCart();
    updateCartCount();
}

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let cartCount = cart.reduce((count, item) => count + item.quantity, 0);
    document.getElementById('cart-count').innerText = cartCount;
}

function openCart() {
    const cartModal = document.getElementById('cartModal');
    const cartItemsDiv = document.getElementById('cart-items');
    cartItemsDiv.innerHTML = '';

    let total = 0;

    cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('cart-item');
        itemDiv.innerHTML = `
            <img src="images/${item.image}" alt="${item.name}">
            <div>${item.name}</div>
            <div>₱${item.price}</div>
            <div class="quantity-controls">
                <button onclick="decreaseQuantity('${item.name}')">-</button>
                <span>${item.quantity}</span>
                <button onclick="increaseQuantity('${item.name}')">+</button>
            </div>
            <div>₱${item.price * item.quantity}</div>
        `;
        cartItemsDiv.appendChild(itemDiv);
        total += item.price * item.quantity;
    });

    const totalDiv = document.createElement('div');
    totalDiv.classList.add('cart-total');
    totalDiv.innerHTML = `
        <strong>Total: ₱${total}</strong>
    `;
    cartItemsDiv.appendChild(totalDiv);

    cartModal.style.display = 'block';
}

function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

function increaseQuantity(name) {
    const item = cart.find(cartItem => cartItem.name === name);
    if (item) {
        item.quantity += 1;
    }
    saveCart();
    openCart(); 
    updateCartCount();
}

function decreaseQuantity(name) {
    const item = cart.find(cartItem => cartItem.name === name);
    if (item && item.quantity > 1) {
        item.quantity -= 1;
    } else {
        cart = cart.filter(cartItem => cartItem.name !== name);
    }
    saveCart();
    openCart();
    updateCartCount();
}

function generateOrderNumber() {
    const now = new Date();
    return 'ORDER' + now.getTime();
}

function checkout() {
    // Generate a unique order number
    const orderNumber = generateOrderNumber();

    // Collect order details
    let orderDetails = `Order Number: ${orderNumber}\n\n`;
    let total = 0;

    cart.forEach(item => {
        orderDetails += `${item.name} - ${item.size} - Quantity: ${item.quantity} - Price: ₱${item.price} - Subtotal: ₱${item.price * item.quantity}\n`;
        total += item.price * item.quantity;
    });

    orderDetails += `\nTotal: ₱${total}`;

    // Collect customer information
    const name = document.getElementById('customer-name').value.trim();
    const houseNumber = document.getElementById('customer-house-number').value.trim();
    const barangay = document.getElementById('customer-barangay').value.trim();
    const city = document.getElementById('customer-city').value.trim();
    const contact = document.getElementById('customer-contact').value.trim();

    if (!name || !houseNumber || !barangay || !city || !contact) {
        alert('Please provide your name, complete address, and contact number.');
        return;
    }

    if (contact.length !== 10 || isNaN(contact)) {
        alert('Please provide a valid 10-digit contact number.');
        return;
    }

    const address = `${houseNumber}, ${barangay}, ${city}`;
    const fullContactNumber = `+63${contact}`;
    orderDetails += `\n\nCustomer Name: ${name}\nCustomer Address: ${address}\nCustomer Contact: ${fullContactNumber}`;

    // EmailJS parameters
    const templateParams = {
        to_name: name, // Use customer's name for personalized greeting
        from_name: 'Cozy Coffee', // Your business name
        message: orderDetails,
        customer_name: name, // Pass customer's name to EmailJS template
        customer_house_number: houseNumber, // Pass customer's house number/street to EmailJS template
        customer_barangay: barangay, // Pass customer's barangay to EmailJS template
        customer_city: city, // Pass customer's city to EmailJS template
        customer_contact: fullContactNumber, // Pass customer's full contact number to EmailJS template
        order_number: orderNumber // Pass the order number to EmailJS template
    };

    console.log('Sending email with params:', templateParams);

    emailjs.send('service_lxkquwi', 'template_08qnakc', templateParams)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            alert('Order sent successfully!', response.status, response.text);
            cart = []; // Clear cart after successful order
            saveCart(); // Save empty cart in localStorage
            updateCartCount(); // Update cart count display
            closeCart(); // Close the cart modal
        }, function(error) {
            console.log('FAILED...', error);
            alert('Failed to send order. Please try again.');
        });
}


function clearCart() {
    cart = [];
    saveCart();
    updateCartCount();
    openCart();
}

function openQuantityModal(item) {
    currentItem = item;
    selectedQuantity = 1;
    document.getElementById('modal-quantity-only').innerText = selectedQuantity;
    const quantityModal = document.getElementById('quantityModal');
    quantityModal.style.display = 'block';
}

function closeQuantityModal() {
    const quantityModal = document.getElementById('quantityModal');
    quantityModal.style.display = 'none';
    currentItem = null;
}

function increaseQuantityOnlyModal() {
    selectedQuantity += 1;
    document.getElementById('modal-quantity-only').innerText = selectedQuantity;
}

function decreaseQuantityOnlyModal() {
    if (selectedQuantity > 1) {
        selectedQuantity -= 1;
        document.getElementById('modal-quantity-only').innerText = selectedQuantity;
    }
}

function addSelectedItemToCartWithoutSize() {
    if (currentItem) {
        const price = currentItem.price; // Assuming the price is fixed for items without size
        addToCart(currentItem.name, price, currentItem.image, 'N/A', selectedQuantity);
        closeQuantityModal();
    } else {
        alert('An error occurred. Please try again.');
    }
}
function openCheckoutForm() {
    document.getElementById('checkoutModal').style.display = 'block';
}

function closeCheckoutForm() {
    document.getElementById('checkoutModal').style.display = 'none';
}

function handleCheckout() {
    // Collect user information
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const contact = document.getElementById('contact').value;

    // Validate the form
    if (!name || !address || !contact) {
        alert('Please fill in all fields.');
        return false;
    }

    // Collect order details
    let orderDetails = '';
    let total = 0;

    cart.forEach(item => {
        orderDetails += `${item.name} - ${item.size} - Quantity: ${item.quantity} - Price: ₱${item.price} - Subtotal: ₱${item.price * item.quantity}\n`;
        total += item.price * item.quantity;
    });

    orderDetails += `\nTotal: ₱${total}`;
    orderDetails += `\n\nName: ${name}\nAddress: ${address}\nContact: ${contact}`;

    // EmailJS parameters
    const templateParams = {
        to_name: name,
        from_name: 'Cozy Coffee', // Your business name
        message: orderDetails
    };

    // Send email using EmailJS
    emailjs.send('service_lxkquwi', 'template_08qnakc', templateParams)
        .then(function(response) {
            alert('Order sent successfully!', response.status, response.text);
            cart = [];
            saveCart();
            updateCartCount();
            closeCheckoutForm();
        }, function(error) {
            console.log('FAILED...', error);
            alert('Failed to send order. Please try again.');
        });

    return false; // Prevent form submission
}

window.onclick = function(event) {
    const sizeQuantityModal = document.getElementById('sizeQuantityModal');
    const cartModal = document.getElementById('cartModal');
    const quantityModal = document.getElementById('quantityModal');
    if (event.target === sizeQuantityModal) {
        sizeQuantityModal.style.display = "none";
    }
    if (event.target === cartModal) {
        cartModal.style.display = "none";
    }
    if (event.target === quantityModal) {
        quantityModal.style.display = "none";
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});
