const socket = io();

//Elements
const $messageForm = document.querySelector('form');
const $inputField = document.getElementById('InputText');
const $sendMessageBtn = document.querySelector('#submitBtn');
const $shareLocationBtn = document.querySelector('#share-location');
const $displayDiv = document.getElementById('display-message');

//templates
const $messageTemplate = document.getElementById('message-template').innerHTML;
const $locationTemplate = document.getElementById('location-template').innerHTML;
const $sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = ()=>{
    const $newMessage = $displayDiv.lastElementChild;
    const newMessageStyle = getComputedStyle($newMessage);
    const newMessageMargin  =  parseInt(newMessageStyle.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    
    const visibleHeight = $displayDiv.offsetHeight;
    const containerHeight=  $displayDiv.scrollHeight;
    const scrolloffset = $displayDiv.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrolloffset){
        $displayDiv.scrollTop = $displayDiv.scrollHeight;
    }

}

socket.on('message', (msg) => {
    console.log(msg);
    // $displayDiv.innerHTML += `<br>${msg}`;
    const html = Mustache.render($messageTemplate, {
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:m a'),
        userName: msg.username
    });
    $displayDiv.insertAdjacentHTML('beforeend', html);
    autoScroll();
})

socket.on('LocationMessage', (link) => {
    console.log(link);
    const html = Mustache.render($locationTemplate, {
        url: link.url,
        createdLocationAt: moment(link.createdAt).format('h:m a'),
        userName:link.username
    });
    $displayDiv.insertAdjacentHTML('beforeend', html);
    autoScroll();
})

socket.on('roomData',({room,users})=>{
    const html  = Mustache.render($sidebarTemplate,{
        room,
        users
    })

    document.getElementById('sidebar').innerHTML = html;
})


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const InputText = $inputField.value;
    //disable btn
    $sendMessageBtn.setAttribute('disabled', 'disabled');

    socket.emit('sendMessage', InputText, (err) => {
        // enable
        $sendMessageBtn.removeAttribute('disabled');
        $inputField.value = '';
        $inputField.focus();

        if (err) {
            return console.log(err);
        }
        console.log('Mesage delivered!');
    });
})


$shareLocationBtn.addEventListener('click', () => {
    $shareLocationBtn.setAttribute('disabled', 'disabled');

    if (!navigator.geolocation) {
        return alert('GeoLocation is not supported in your browser.')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $shareLocationBtn.removeAttribute('disabled');
            console.log('Location shared!');
        });

    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
})

