<?php
$conn = new PDO("pgsql:host=ep-misty-bread-axhclh7m-pooler.c-4.us-east-2.aws.neon.tech;dbname=neondb;sslmode=require", "neondb_owner", "npg_yrpcd7AXlD8s");
$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$sql = file_get_contents("schema.sql");
$statements = array_filter(array_map("trim", explode(";", $sql)));
$count = 0;
foreach ($statements as $stmt) {
    if (empty($stmt) || str_starts_with($stmt, "--")) continue;
    try {
        $conn->exec($stmt);
        $count++;
    } catch (Exception $e) {
        echo "SKIP: " . substr($e->getMessage(), 0, 80) . "\n";
    }
}
echo "Executed $count statements successfully\n";
$conn = null;
?>
