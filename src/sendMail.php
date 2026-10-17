<?php
/**
 * Appointment request mailer — AB'S Dental & Aesthetics
 * Receives the popup form (POST), validates it and emails the clinic.
 * - AJAX requests get a plain "success" / "error" reply (script.js reads this).
 * - A normal form post (JavaScript off) gets an alert and a redirect home.
 */
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH'])
    && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';

function respond($ok, $isAjax)
{
    if ($isAjax) {
        header('Content-Type: text/plain; charset=UTF-8');
        echo $ok ? 'success' : 'error';
    } else {
        $msg = $ok
            ? 'Appointment submitted successfully!'
            : 'Error sending request. Please call +91 93470 62933.';
        echo "<script>alert(" . json_encode($msg) . "); window.location.href='/index.html';</script>";
    }
    exit;
}

// Strip tags and line breaks (blocks email header injection) and cap the length.
function clean($value, $max = 200)
{
    $value = strip_tags(trim((string) $value));
    $value = preg_replace('/[\r\n]+/', ' ', $value);
    return mb_substr($value, 0, $max);
}

// Honeypot: real visitors never fill this hidden field, bots usually do.
if (!empty($_POST['website'])) {
    respond(true, $isAjax);
}

$name     = clean($_POST['name'] ?? '', 100);
$phone    = clean($_POST['phone'] ?? '', 20);
$email    = clean($_POST['email'] ?? '', 120);
$category = clean($_POST['disease'] ?? '', 20);
$service  = clean($_POST['service'] ?? '', 80);
$date     = clean($_POST['date'] ?? '', 20);

if ($name === '' || !preg_match('/^[0-9+()\-\s]{8,20}$/', $phone)) {
    respond(false, $isAjax);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, $isAjax);
}
if (!in_array($category, ['Dental', 'Skin', 'Hair'], true)) {
    $category = 'Not specified';
}

$to      = 'absdental69@gmail.com';
$subject = 'New Appointment Request - ' . $name;

$lines = [
    "Name: $name",
    "Phone: $phone",
    'Email: ' . ($email !== '' ? $email : '-'),
    "Interested in: $category",
    'Service: ' . ($service !== '' ? $service : '-'),
    'Preferred date: ' . ($date !== '' ? $date : '-'),
    'Sent from: ' . ($_SERVER['HTTP_REFERER'] ?? 'website'),
];
$message = implode("\n", $lines);

$headers  = "From: AB'S Dental <noreply@absdental.in>\r\n";
if ($email !== '') {
    $headers .= "Reply-To: $email\r\n";
}
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

respond(@mail($to, $subject, $message, $headers), $isAjax);
