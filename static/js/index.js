window._cookie = function(){
    /* Read document cookie
    Returns object
    */
    var cookie_obj = {};
    var cookiearray = document.cookie.split("; ");
    for (var i = 0; i < cookiearray.length; i++) {
        cookie_obj[cookiearray[i].split("=")[0]] = decodeURIComponent(cookiearray[i].split("=")[1])
    }
    return cookie_obj
}()

window._cookie_exp = function(){
    var d = new Date();
    d.setFullYear(d.getFullYear() + 10);
    return d.toUTCString();
}()

class socket {
    constructor(url){
        this.ws = new ReconnectingWebSocket(url)
        this.ws.send_queue = Array();
        this.ws.warning_message = false; // Indicates if warning message is open in browser
        this.ws.onmessage = this.recv;
        this.ws.onopen = this.sockopened;
        this.ws.onclose = this.sockclosed;
    }
    send(method, args, kwargs){
        var cmd = {'method': method, 'args': args || [], 'kwargs': kwargs || {}}
        if(this.ws.readyState != 1 && this.ws.warning_message == false){
            this.ws.send_queue.unshift(cmd)
        } else {
            this.ws.send(JSON.stringify(cmd))
        }
    }
    recv(msg){
        var m = JSON.parse(msg.data)
        console.log(m)
        if(m.command == 'set'){
            if(m.ref == null || m.ref == undefined){
                for(var k in m.data){
                    app[k] = m.data[k]
                }
            } else {
                for(var k in m.data){
                    app.$refs[m.ref][k] = m.data[k]
                }
            }
        } else if (m.command == 'notify'){
            app.$Notify(m.notification)
        }
    }
    sockopened(){
        if(this.warning_message){
            this.close_warning();
            app.$Message.success({message: 'Reconnected to server.', duration: 1500});
        }
        for(var i=this.send_queue.length - 1; i >= 0; i--){
            this.send(JSON.stringify(this.send_queue[i]))
            this.send_queue.pop();
        }
    }
    sockclosed(){
        if(!this.warning_message){
            this.close_warning = app.$Message.warning({message: 'Connection to server lost.', duration: 0});
            this.warning_message = true;
        }
    }
    notify(title, message, type, autoclose){
        app.$Notify({})
    }
}

Vue.use(VueLazyload)
Vue.config.devtools = false

templates = {
    'navbar': httpVueLoader('/static/components/navbar.vue'),
    'library': {'status': httpVueLoader('/static/components/library/status.vue'),
                'status_modal': httpVueLoader('/static/components/library/status_modal.vue'),
                'add': httpVueLoader('/static/components/library/add.vue')
                }
}

Vue.component('navbar', templates['navbar']);
Vue.component('status-modal', templates['library']['status_modal'])

router = new VueRouter({
    mode: 'hash',
    base: window.location.href,
    routes: [{path: '/library/status', component: templates['library']['status']},
             {path: '/library/add', component: templates['library']['add']}
            ]
})

app = new Vue({
    el: '#app',
    router: router,
    data: {socket: new socket('ws://localhost:9090/ws')},
    methods:{
        handle_select: function(){}
    }
});
