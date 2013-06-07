// ==UserScript==
// @name       Tripletex Brønnøysund
// @namespace  http://github.com/omelhus
// @version    1.0
// @description  Hent firmainformasjon fra Brønnøysund i Tripletex. Søk på navn eller bruk shift + enter i orgnr for å hente informasjon.
// @match       https://tripletex.no/execute/customer*
// @copyright  2013+, Ole Melhus
// @require http://code.jquery.com/jquery-2.0.2.min.js
// @require http://code.jquery.com/ui/1.10.3/jquery-ui.js
// ==/UserScript==
/*
    forradrkommnr: "1505"
    forradrland: "Norge"
    forradrpostnr: "6517"
    forradrpoststed: "KRISTIANSUND N"
    forretningsadr: "Industriveien 8A"
    moms: "J"
    navn: "ON IT AS"
    nkode1: "62.010"
    nkode2: ""
    nkode3: ""
    organisasjonsform: "AS"
    orgnr: "996825396"
    postadresse: ""
    ppostland: ""
    ppostnr: ""
    ppoststed: ""
    regifr: "J"
*/

(function(){
	   
    var brreg = "https://hotell.difi.no/api/json/brreg/enhetsregisteret";
    
    var fetchInfo = function(orgnr, callback){
        $.ajax({
            url: brreg,
            method: 'get',
            data: { orgnr: orgnr },
            success: function(data){
                var entry = data.entries[0];
                if(entry){
                    callback(entry);
                }
            }
        });
    };
    
    var setField = function(field, value){
        $("input[name='customer\\." + field + "']").val(value);
    }
    
    var fillFields = function(entity){
        console.log(entity);
        setField("name", entity.navn);   
        setField("number", entity.orgnr);   
        setField("physicalAddress1", entity.forretningsadr);
        setField("physicalPostalCode", entity.forradrpostnr);
        setField("physicalCity", entity.forradrpoststed);
        if(entity.postadresse && entity.ppostnr){
            
            setField("address1", entity.postadresse);
        	setField("postalcode", entity.ppostnr);
        	setField("city", entity.ppoststed);      
        } else {
            
            setField("address1", entity.forretningsadr);
        	setField("postalcode", entity.forradrpostnr);
        	setField("city", entity.forradrpoststed);
        }
    };
    
    var search = function (query, callback) {
        $.ajax({
            url: brreg,
            method: 'get',
            data: {
                query: query
            },
            success: function (data) {
                callback(data.entries);
            }
        });
    };
    
    var select = function (event, ui) {
        var item = ui.item;
        fillFields(item);
        return false;
    };
    
    var cache = {};
    
    var initAutoComplete = function(){
        $("input[name='customer\\.name']").autocomplete({
            minLength: 3,
            source: function (request, response) {
                if (cache[request.term]) {
                    response(cache[request.term]);
                } else {
                    search(request.term, function (entries) {
                        cache[request.term] = entries;
                        response(entries);
                    });
                }
            },
            select: select,
        }).data("ui-autocomplete")._renderItem = function (ul, item) {
            return $("<li>")
                .append("<a>" + item.navn + "<br><small>" + item.forretningsadr + ", " + item.forradrpostnr + " " + item.forradrpoststed + "</small></a>")
                .appendTo(ul);
        };  
    };
    
    $(function(){
        $("body").on("keydown", "input[name='customer\\.number']", function(event){
            if(event.shiftKey && event.keyCode == 13) {
                var orgNo = $(this).val();
                fetchInfo(orgNo, fillFields);
            }
        });
        setTimeout(function(){
        	initAutoComplete();
        }, 500);
    });
    
})();
