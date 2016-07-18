//$(document).bind('ready',function() {


    (function () { // open IIFE

        var container = document.getElementById('mostwanted');

        $.get("/api/trends/mostwanted?limit=10", function (data, status) {

            console.log(data.results);
            var items = [];
            for (var i = 0; i < data.results.length; ++i) {
                var e = data.results[i];
                console.log(e);
                items.push({x: i, label: {content: e._id}, y: e.count});
            }
            console.log(items);
            var dataset = new vis.DataSet(items);
            var options = {
                style: 'bar',
                barChart: {width: 50, align: 'center'}, // align: left, center, right
                drawPoints: {
                    onRender: function (item, group, grap2d) {
                        return item.label != null;
                    },
                    style: 'circle'
                },
                dataAxis: {
                    icons: true
                },
                orientation: 'top'

            };
            var graph2d = new vis.Graph2d(container, items, options);

        });


    }()); // close IIFE

    (function () { // open IIFE

        var container = document.getElementById('mostfound');

        $.get("/api/trends/mostfound?limit=10", function (data, status) {

            console.log(data.results);
            var items = [];
            for (var i = 0; i < data.results.length; ++i) {
                var e = data.results[i];
                console.log(e);
                items.push({x: i, label: {content: e._id}, y: e.results});
            }
            console.log(items);
            var dataset = new vis.DataSet(items);
            var options = {
                style: 'bar',
                barChart: {width: 50, align: 'center'}, // align: left, center, right
                drawPoints: {
                    onRender: function (item, group, grap2d) {
                        return item.label != null;
                    },
                    style: 'circle'
                },
                dataAxis: {
                    icons: true
                },
                orientation: 'top'

            };
            var graph2d = new vis.Graph2d(container, items, options);

        });


    }()); // close IIFE


    (function () { // open IIFE

        var container = document.getElementById('rare');

        $.get("/api/trends/rare?limit=10", function (data, status) {

            console.log(data.results);
            var items = [];
            for (var i = 0; i < data.results.length; ++i) {
                var e = data.results[i];
                console.log(e);
                items.push({x: i, label: {content: e._id}, y: e.results});
            }
            console.log(items);
            var dataset = new vis.DataSet(items);
            var options = {
                style: 'bar',
                barChart: {width: 50, align: 'center'}, // align: left, center, right
                drawPoints: {
                    onRender: function (item, group, grap2d) {
                        return item.label != null;
                    },
                    style: 'circle'
                },
                dataAxis: {
                    icons: true
                },
                orientation: 'top'

            };
            var graph2d = new vis.Graph2d(container, items, options);

        });


    }()); // close IIFE
    (function () { // open IIFE

        var container = document.getElementById('notfound');

        $.get("/api/trends/notfound?limit=10", function (data, status) {

            console.log(data.results);
            var items = [];
            for (var i = 0; i < data.results.length; ++i) {
                var e = data.results[i];
                console.log(e);
                items.push({x: i, label: {content: e._id}, y: e.results});
            }
            console.log(items);
            var dataset = new vis.DataSet(items);
            var options = {
                style: 'bar',
                barChart: {width: 50, align: 'center'}, // align: left, center, right
                drawPoints: {
                    onRender: function (item, group, grap2d) {
                        return item.label != null;
                    },
                    style: 'circle'
                },
                dataAxis: {
                    icons: true
                },
                orientation: 'top'

            };
            var graph2d = new vis.Graph2d(container, items, options);

        });


    }()); // close IIFE


//});