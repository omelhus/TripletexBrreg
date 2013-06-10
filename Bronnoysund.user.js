// ==UserScript==
// @name		Tripletex Brønnøysund
// @namespace	http://github.com/omelhus
// @version		2.1
// @description	Hent firmainformasjon fra Brønnøysund i Tripletex. Søk på navn eller bruk shift + enter i orgnr for å hente informasjon.
// @match       https://tripletex.no/execute/*
// @match       https://tripletex.no/contentBlank*
// @grant 		GM_Log
// @copyright	2013+, Ole Melhus
// @require		http://code.jquery.com/jquery-2.0.2.min.js
// @require		http://code.jquery.com/ui/1.10.3/jquery-ui.js
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
    	return (str + '').toLowerCase().replace(/^([a-zæøå])|\s+([a-zæøå])/g, function ($1) {
        	return $1.toUpperCase();
    	});
	}
    
    var parseName = function(name){
        return ucWords(name);
    }
    
    var _setElementValue = function(id, value){
        if(typeof setElementValue !== "undefined"){
            setElementValue(id, value);
        } else {
         	$("input[name='" + id.replace(".","\\.") + "']").val(value);   
			$("input[name='" + id.replace(".","\\.") + "Select" + "']").val("Norge");   
        }
    }
    
    var fillFields = function(entity){
        setField("name", parseName(entity.navn));   
        setField("number", entity.orgnr);   
        setField("physicalAddress1", entity.forretningsadr);
        setField("physicalPostalCode", entity.forradrpostnr);
        setField("physicalCity", ucWords(entity.forradrpoststed));
        if(entity.forradrland === "Norge")
            _setElementValue("customer.physicalCountryId", 161);
        if(entity.postadresse && entity.ppostnr){
            setField("address1", entity.postadresse);
        	setField("postalcode", entity.ppostnr);
        	setField("city", ucWords(entity.ppoststed));    
        	if(entity.ppostland === "Norge")
                _setElementValue("customer.countryId", 161);
        } else {
            setField("address1", entity.forretningsadr);
        	setField("postalcode", entity.forradrpostnr);
        	setField("city", ucWords(entity.forradrpoststed));
        	if(entity.forradrland === "Norge")
                _setElementValue("customer.countryId", 161);
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
    };
    
    var focus = function (event, ui){
        ui.item.value = ucWords(ui.item.navn);
    };
    
    var cache = {};
    
    var initAutoComplete = function(element){
        element.autocomplete({
            minLength: 2,
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
            focus: focus,
        }).data("ui-autocomplete")._renderItem = function (ul, item) {
            return $("<li>")
                .append("<a>" + ucWords(item.navn) + "<br><small>" + item.forretningsadr + ", " + item.forradrpostnr + " " + ucWords(item.forradrpoststed) + "</small></a>")
                .appendTo(ul);
        };  
    };
       
    $(function(){
        $(document).on("keydown", "input[name='customer\\.number']", function(event){
            if(event.shiftKey && event.keyCode == 13) {
                var orgNo = $(this).val();
                fetchInfo(orgNo, fillFields);
            }
        });
        
        $(document).on("focus", "input[name='customer\\.name']", function(event){
            if(!$(this).data("ui-autocomplete")){
                initAutoComplete($(this));   
            }
        });
        
        $(document).on("keyup", "input[name*='PostalCode'], input[name*='postalcode']", function(){
            var input = $(this);
            var value = input.val();
            var output = $(this).next("input[type=text]");
            if(value.length===4){
                $.getJSON('https://fraktguide.bring.no/fraktguide/postalCode.json?pnr='+ value,
				function(data){
					if(data.valid){
                        input.removeClass("ui-state-error");
						output.val(ucWords(data.result));
					} else {
                        input.addClass("ui-state-error");
						output.val('');
                        output.attr("placeholder", "Ugyldig postnummer");
					}
				});
            }           
        });
    });
    
})();
