// ==UserScript==
// @name		Tripletex Telefonkatalog + Postnroppslag
// @namespace	http://github.com/omelhus
// @version		2.8
// @description	Oppslag mot Brreg er implementert av Tripletex selv. Denne henter nå kun mot telefonnr og postnummer.
// @match       https://tripletex.no/execute/*
// @match       https://tripletex.no/contentBlank*
// @grant 		GM_xmlhttpRequest
// @copyright	2013+, Ole Melhus
// @require		http://code.jquery.com/jquery-2.0.2.min.js
// @require		http://code.jquery.com/ui/1.10.3/jquery-ui.js
// ==/UserScript==
(function(){

    var setField = function(field, value){
        $("input[name$='\\." + field + "']").val(value);
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
            $("input[name$='\\." + id + "']").val(value);   
            $("input[name$='\\." + id + "Select" + "']").val("Norge");
    }
    
    
    var removeTrailing = function(str){        
        var parsed = str.replace(/,*\s*$/, "");
        return parsed;
    }
    
    var fillFields = function(entity){
        
        if(entity.navn)
            setField("name", parseName(entity.navn)); 
        if(entity.fornavn)
            setField("firstname", parseName(entity.fornavn));
        if(entity.etternavn)
            setField("lastname", parseName(entity.etternavn));
        
        if(entity.orgnr)
            setField("number", entity.orgnr);   
        if(entity.homepage)
            setField("homePage", entity.homepage);   
        if(entity.forretningsadr)
            setField("physicalAddress1", removeTrailing(entity.forretningsadr));
        if(entity.forradrpostnr)
            setField("physicalPostalCode", entity.forradrpostnr);
        if(entity.forradrpoststed)
            setField("physicalCity", ucWords(entity.forradrpoststed));
        
        if(entity.forradrland === "Norge")
            _setElementValue("physicalCountryId", 161);

        if(entity.postadresse && entity.ppostnr){
            setField("address1", removeTrailing(entity.postadresse));
            setField("postalcode", entity.ppostnr);
            setField("city", ucWords(entity.ppoststed));    
            
            if(entity.ppostland.toLowerCase() === "norge")
                _setElementValue("countryId", 161);
                        
        } else {
            setField("address1", removeTrailing(entity.forretningsadr));
            setField("postalcode", entity.forradrpostnr);
            setField("city", ucWords(entity.forradrpoststed));
            if(entity.forradrland.toLowerCase() === "norge")
                _setElementValue("countryId", 161);
        }
    };
    
    var parseCompany = function(company){
        return entity = {
            navn: company.find(".header h2 a").text(),
            forretningsadr: company.find(".street-address").text(),
            forradrpostnr: company.find(".postal-code").text(),
            forradrpoststed: ucWords(company.find(".locality").text()),
            forradrland: 'Norge',
            homepage: company.find(".header h3 a").text()
        };        
    }
    
    var parsePerson = function(person){
        return entity = {
            navn: person.find(".title .given-name").text() + " " + person.find(".title .family-name").text(),
            fornavn: person.find(".title .given-name").text(),
            etternavn: person.find(".title .family-name").text(),
            forretningsadr: person.find(".addressinfo:first .street-address").text(),
            forradrpostnr: person.find(".addressinfo:first .postal-code").text(),
            forradrpoststed: ucWords(person.find(".addressinfo:first .locality").text()),
            forradrland: 'Norge'
        };        
    }
    
    $(function(){

        $(document).on("keydown", "input[name='customer\\.phonenumber'], input[name^='employee\\.phoneNumber'], input[name^='customer\\.phoneNumberMobile']", function(event){
            if(event.shiftKey && event.keyCode == 13) {
                var phoneNumber = $(this).val();
                var url = "https://www.gulesider.no/person/resultat/" + phoneNumber;
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    onload: function(response){
                        var content = response.response;
                        var src = $(content);
                        src.remove("img, script");
                        var entity;
                        var company = src.find("#result-list .hit:first");
                        if(company.length>0){
                            entity =  parseCompany(company);  
                        } else {
                            var person = src.find(".person-info");
                            entity = parsePerson(person);
                        }
                        fillFields(entity); 
                    }
                });
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
