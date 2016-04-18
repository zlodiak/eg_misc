$(document).ready(function() {
  $('#lblSearch').on('click', function() {
    $('#searchForm').toggleClass('active');
    $('#menu').toggleClass('reduce');
  });
});