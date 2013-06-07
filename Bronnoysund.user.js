// ==UserScript==
// @name       Tripletex Brønnøysund
// @namespace  http://github.com/omelhus
// @version    1.3
// @description  Hent firmainformasjon fra Brønnøysund i Tripletex. Søk på navn eller bruk shift + enter i orgnr for å hente informasjon.
// @match       https://tripletex.no/execute/customer*
// @copyright  2013+, Ole Melhus
// @require http://code.jquery.com/jquery-2.0.2.min.js
// @require http://code.jquery.com/ui/1.10.3/jquery-ui.js
// ==/UserScript==

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
    
    var ucWords = function (str) { // http://stackoverflow.com/a/4609587/491094
    	return (str + '').replace(/^([a-zæøå])|\s+([a-zæøå])/g, function ($1) {
        	return $1.toUpperCase();
    	});
	}
    
    var parseName = function(name){
     	var lower = name.toLowerCase();
        var uc = ucWords(lower);
        return uc.replace(' as', ' AS');
    }
    
    var fillFields = function(entity){
        console.log(entity);
        setField("name", parseName(entity.navn));   
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

