$(function() {
    var app = angular.module('app', []);

    app.filter('slugify', function() {
        return function(input) {
            return input.replace(/[^\w]/g, '').replace(/\s+/g, '-').toLowerCase();
        };
    });

    app.controller('Ctrl', function($scope, $http, $location, $filter) {
        var all = [];
        $http.get('data.tsv').then(function(response) {
            $scope.filters = { };
            var reverseFilters = {};

            $scope.data = d3.tsv.parse(response.data, (function() {
                var essentialColumns = ['Titre', 'Chapo', 'Date', 'Lien'];

                return function(d) {
                    d.Date = new Date(d.Date.split('/').reverse()); // Transform date into Date object

                    // Get filters
                    _.each(d, function(value, key) {
                        if (essentialColumns.indexOf(key) < 0 && value.length > 0) {
                            if ($scope.filters[key] == null) {
                                $scope.filters[key] = { values : ['--'] , value : '--' };
                            }

                            $scope.filters[key].values = _.uniq([value].concat($scope.filters[key].values));
                        }
                    });

                    return d;
                };
            })());

            all = _.clone($scope.data);

            $scope.data = _.sortByOrder($scope.data, 'Date', 'desc');
        });

        $scope.filter = function() {
            var template = { };

            _.each($scope.filters, function(filter, key) {
                if (filter.value !== '--') {
                    template[key] = filter.value;
                }
            });

            $scope.data = _(_.clone(all)).filter(template).sortByOrder('Date', 'desc').run();
        };

        $scope.reset = function() {
            _.each($scope.filters, function(filter) {
                filter.value = '--';
            });

            $scope.filter();
        };
    });
});
