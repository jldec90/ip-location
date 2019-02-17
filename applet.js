const Applet = imports.ui.applet;
const Settings = imports.ui.settings;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Json = imports.gi.Json;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const Gettext = imports.gettext;

const UUID = "ip-location@jldec";
const GEO_IP_URL = 'http://ip-api.com/json';
//const REFRESH_INTERVAL = 30
const APPLET_PATH = imports.ui.appletManager.appletMeta[UUID].path;
imports.searchPath.push(APPLET_PATH);

// Applet
// ----------
function _(str) {
    let customTranslation = Gettext.dgettext(UUID, str);
    if(customTranslation != str) {
        return customTranslation;
    }
    return Gettext.gettext(str);
}

function MyApplet(metadata, orientation, panelHeight, instance_id) {
    this._init(metadata, orientation, panelHeight, instance_id);
}


MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(metadata, orientation, panelHeight, instance_id) {
        Applet.TextIconApplet.prototype._init.call(this, orientation, panelHeight, instance_id);
        this.settings = new Settings.AppletSettings(this, metadata.uuid, this.instance_id);
        this.settings.bindProperty(Settings.BindingDirection.IN,
            "refresh",
            "refresh_value",
            this.on_settings_changed,
            null);
                
        try {
            //dialog-error
            this.set_applet_icon_name("emblem-web");
            this.set_applet_tooltip(_("Search location in progress ..."));
            this.set_applet_label("");
        }
        catch (error) {
            global.logError(UUID + ' : ' + error);
        }
        this.refreshLocation();
    },

    on_settings_changed: function() {
        global.log(UUID + ' : update setting : interval='+this.refresh_value);
    },

    refreshLocation: function refreshLocation() {
        let json = null;
        let message = Soup.Message.new('GET', GEO_IP_URL);
        let session = Soup.Session.new();
        session.send_message (message);
            if (message.status_code === 200) {
                global.log(UUID + ' : body : '+ message.response_body.data);
                let jp = new Json.Parser();
                jp.load_from_data(message.response_body.data, -1);
                json = jp.get_root().get_object();
                //global.log("json:"+json);
            }
        //global.log(json);
        if (json !== null) {
            json.get_members().forEach(function(item) {
                global.log(UUID + ' : ' + item,json.get_string_member(item));
            });              
            let city = json.get_string_member('city');
            let ip = json.get_string_member('query');
            let countryCode = json.get_string_member('countryCode');
            
            // city name is returned from IPInfoDB in upper case
            city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
            countryCode = countryCode.toLowerCase();
            
            //this.hide_applet_icon();
            //this.set_applet_icon_path( global.userdatadir + "/applets/" + UUID + "/flags/" + countryCode + ".png");                            
            this.set_applet_icon_path( APPLET_PATH + "/flags/" + countryCode + ".png");                            
            this.set_applet_label('');
            this.set_applet_tooltip(_(city + ' \n(' + ip + ')\n' + countryCode));
        }
        else {
            // error getting location                
            this.set_applet_tooltip(_('Error'));                
            //this.set_applet_label('Error');
        }
        
        Mainloop.timeout_add_seconds(this.refresh_value, Lang.bind(this, function refreshTimeout() {
            global.log(UUID + " : Refresh ..."+this.refresh_value);              
            this.refreshLocation();
        }));
    }
};


function main(metadata, orientation, panelHeight, instance_id) {  // Make sure you collect and pass on instanceId
    global.log(UUID + ": Start .................................");
    let myApplet = new MyApplet(metadata, orientation, panelHeight, instance_id);
    return myApplet;
}
