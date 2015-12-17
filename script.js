$(function() {
    var app = angular.module('app', []);

    app.filter('slugify', function() {
        return function(input) {
            return input.replace(/[^\w]/g, '').replace(/\s+/g, '-').toLowerCase();
        };
    });

    app.controller('Ctrl', function($scope, $http, $location, $filter, $sce) {
        var essentialColumns = ['Titre', 'Chapo', 'Date', 'Lien'];

        $scope.all = $scope.data = [];

        $http.get('data.tsv').then(function(response) {
            $scope.filters = { };
            var reverseFilters = { };

            $scope.data = d3.tsv.parse(response.data, function(d) {
                d.Chapo = $sce.trustAsHtml(d.Chapo);
                d.Date = new Date(d.Date.split('/').reverse()); // Transform date into Date object

                // Get filters
                _.each(d, function(value, key) {
                    if (essentialColumns.indexOf(key) < 0 && value.length > 0) {
                        delete d[key]; // TMP
                        key = key.split('(')[0].trim(); // TMP
                        d[key] = _.map(value.split(','), _.trim);

                        if ($scope.filters[key] == null) {
                            reverseFilters[$filter('slugify')(key)] = key; // Init filter

                            $scope.filters[key] = {
                                values: ['--'],
                                value: $location.search()[$filter('slugify')(key)] || '--', // Try to load value from URL before using default
                                slug: $filter('slugify')(key)
                            };
                        }

                        $scope.filters[key].values =
                            _.uniq(d[key].concat($scope.filters[key].values));
                    }
                });

                return d;
            });

            // Make sure we're only using existing values
            _.each($scope.filters, function(filter, key) {
                if (filter.values.indexOf(filter.value) < 0) {
                    filter.value = '--'; // Reset to default
                }

                filter.values = filter.values.sort();
            });

            $scope.all = _.clone($scope.data);

            $scope.filter();
        });

        $scope.filter = function() {
            var template = { };

            _.each($scope.filters, function(filter, key) {
                if (filter.value !== '--') {
                    template[key] = [filter.value];
                }
            });

            $scope.data = _($scope.all).filter(template).sortByOrder('Date', 'desc').run();
        };

        $scope.updateURLAndFilter = function() {
            // Update URL
            _.each($scope.filters, function(filter, key) {
                $location.search(filter.slug, filter.value === '--' ? null : filter.value);
            });

            // And filter
            $scope.filter(true);
        };

        $scope.reset = function() {
            // Reset every filter
            _.each($scope.filters, function(filter) {
                filter.value = '--';
            });

            $scope.updateURLAndFilter();
        };

        $scope.hasResult = function() {
            return $scope.data.length > 0;
        };

        $scope.getAllFilters = function(d) {
            return _.filter(Object.keys(d), function(k) {
                return k[0] !== '$' && essentialColumns.indexOf(k) < 0 && d[k].length > 0;
            });
        };
    });
});
