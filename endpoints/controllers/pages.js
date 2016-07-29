
exports.upload = function(req, res)
{
  var c = 
`
<html>
  <head>
    <title>File upload Node.</title>
  </head>
  <body>
      <form id="uploadForm"
          enctype="multipart/form-data"
          action="http://seidue.crs4.it:3011/attachments?id=100"
          method="post">
      <input type="file" name="document" multiple />
      <input type="submit" value="Upload document" name="submit">
      <input type='text' id='random' name='random'><br>
      <span id = "status"></span>
    </form>
  </body>
  
  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
  <script src="http://cdnjs.cloudflare.com/ajax/libs/jquery.form/3.51/jquery.form.min.js"></script>
  <script>
  $(document).ready(function() {
     $('#uploadForm').submit(function() {
        $("#status").empty().text("File is uploading...");
        $(this).ajaxSubmit({
            error: function(xhr) {
          console.log(xhr);
            },
            success: function(response) {
        console.log(response)
            $("#status").empty().text(response);
            }
    });
    return false;
    });    
});
</script>
  
</html>
`;
    res.send(c);
}
