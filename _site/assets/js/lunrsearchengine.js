
var documents = [{
    "id": 0,
    "url": "http://0.0.0.0:4000/404.html",
    "title": "404",
    "body": "404 Page does not exist!Please use the search bar at the top or visit our homepage! "
    }, {
    "id": 1,
    "url": "http://0.0.0.0:4000/about",
    "title": "About Me",
    "body": "I am a Software Engineer with years of experience in Microsoft technologies interested in developing cutting edge web application with interactivity, leveraging latest technologies. I have been hands-on most of my career and consider myself a Full-Stack developer. I have been developing solutions using various technologies. ASP. Net, . Net Core, Node, Angular, Elasticsearch to name a few. Having said that, the concept of Microservices has made it irrelevant what programming language you choose. With the advent of cloud services, I have taken a keen interest in the AWS ecosystem and have now think Cloud-First. If you have spoken to me about solving a problem in a decoupled manner, you will hear me use SQS as the go-to service. "
    }, {
    "id": 2,
    "url": "http://0.0.0.0:4000/categories",
    "title": "Categories",
    "body": ""
    }, {
    "id": 3,
    "url": "http://0.0.0.0:4000/",
    "title": "Home",
    "body": "      All Stories:                                                                                                     New Year Resolution (2021)              :       So here I am at the start of year 2021, which I assume a lot were really looking forward to, especially how 2020 went by with the Pandemic driving everyone. . . :                                                                               Parag                03 Jan 2021                                            "
    }, {
    "id": 4,
    "url": "http://0.0.0.0:4000/robots.txt",
    "title": "",
    "body": "      Sitemap: {{ “sitemap. xml”   absolute_url }}   "
    }, {
    "id": 5,
    "url": "http://0.0.0.0:4000/new-year-resolution/",
    "title": "New Year Resolution (2021)",
    "body": "2021/01/03 - So here I am at the start of year 2021, which I assume a lot were really looking forward to, especially how 2020 went by with the Pandemic driving everyone to stay indoors as long as they can. In the recent past, one of my colleagues mentioned how he thought it would be a good idea to blog about stuff, not just anything but how we use the technology at hand to solve complex problems. At that point my heart was shouting out “Yes, Absolutely!” but then my brain was like “Hold On! Do not get carried away Bolt”. The reason my brain told me this, because I do not feel I am the one with words. Even when I am trying to explain stuff, I like to draw it out, use illustrations, make associations, elaborate those minute details. I decided to go with my Brain and politely declined being a part of writing a Blog and agreed to proof read it if need be. Then came this long Christmas break where I was suddenly left with nothing to do, other than entertaining my 7 year old and a 10 month old baby, but to learn more. I started watching webinars, videos, reading blogs, etc. , This is where my brain started suggesting improvements to what I was reading or watching and I thought to myself, well these guys are quite similar to me who might not be great with words and yet they have their content out there helping people like me learn. So here I am with a New Year Resolution, to take the plunge into blogging and will try to do justice to my decision. And if I do not manage to keep this resolution, well not really a big deal because Resolutions are made only to be broken. Hope to share &amp; impart my knowledge and to recall the experiences I have had over the years. HAPPY NEW YEAR EVERYONE. HOPING FOR A BETTER 2021. "
    }];

var idx = lunr(function () {
    this.ref('id')
    this.field('title')
    this.field('body')

    documents.forEach(function (doc) {
        this.add(doc)
    }, this)
});
function lunr_search(term) {
    document.getElementById('lunrsearchresults').innerHTML = '<ul></ul>';
    if(term) {
        document.getElementById('lunrsearchresults').innerHTML = "<p>Search results for '" + term + "'</p>" + document.getElementById('lunrsearchresults').innerHTML;
        //put results on the screen.
        var results = idx.search(term);
        if(results.length>0){
            //console.log(idx.search(term));
            //if results
            for (var i = 0; i < results.length; i++) {
                // more statements
                var ref = results[i]['ref'];
                var url = documents[ref]['url'];
                var title = documents[ref]['title'];
                var body = documents[ref]['body'].substring(0,160)+'...';
                document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML = document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML + "<li class='lunrsearchresult'><a href='" + url + "'><span class='title'>" + title + "</span><br /><span class='body'>"+ body +"</span><br /><span class='url'>"+ url +"</span></a></li>";
            }
        } else {
            document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML = "<li class='lunrsearchresult'>No results found...</li>";
        }
    }
    return false;
}

function lunr_search(term) {
    $('#lunrsearchresults').show( 400 );
    $( "body" ).addClass( "modal-open" );
    
    document.getElementById('lunrsearchresults').innerHTML = '<div id="resultsmodal" class="modal fade show d-block"  tabindex="-1" role="dialog" aria-labelledby="resultsmodal"> <div class="modal-dialog shadow-lg" role="document"> <div class="modal-content"> <div class="modal-header" id="modtit"> <button type="button" class="close" id="btnx" data-dismiss="modal" aria-label="Close"> &times; </button> </div> <div class="modal-body"> <ul class="mb-0"> </ul>    </div> <div class="modal-footer"><button id="btnx" type="button" class="btn btn-danger btn-sm" data-dismiss="modal">Close</button></div></div> </div></div>';
    if(term) {
        document.getElementById('modtit').innerHTML = "<h5 class='modal-title'>Search results for '" + term + "'</h5>" + document.getElementById('modtit').innerHTML;
        //put results on the screen.
        var results = idx.search(term);
        if(results.length>0){
            //console.log(idx.search(term));
            //if results
            for (var i = 0; i < results.length; i++) {
                // more statements
                var ref = results[i]['ref'];
                var url = documents[ref]['url'];
                var title = documents[ref]['title'];
                var body = documents[ref]['body'].substring(0,160)+'...';
                document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML = document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML + "<li class='lunrsearchresult'><a href='" + url + "'><span class='title'>" + title + "</span><br /><small><span class='body'>"+ body +"</span><br /><span class='url'>"+ url +"</span></small></a></li>";
            }
        } else {
            document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML = "<li class='lunrsearchresult'>Sorry, no results found. Close & try a different search!</li>";
        }
    }
    return false;
}
    
$(function() {
    $("#lunrsearchresults").on('click', '#btnx', function () {
        $('#lunrsearchresults').hide( 5 );
        $( "body" ).removeClass( "modal-open" );
    });
});