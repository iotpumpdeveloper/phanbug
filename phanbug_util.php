<?php
function phanbug_inspect($variable, $isSpecificVar = false)
{
    ini_set('memory_limit','16M');
    print "\n\n";
    print "phanbug breakpoint:\n";
    print "variable details:\n";
    if (!$isSpecificVar) {
        $variable = array_diff_key($variable, array_flip(['GLOBALS', '_FILES', '_COOKIE', '_POST', '_GET', '_SERVER', '_ENV', '_REQUEST', 'argc', 'argv']));
        var_dump($variable);
        $variable = json_decode(json_encode($variable), true);
    } else {
        print_r(json_decode(json_encode($variable)));
    }

    print "\n\n";

    print "Call Trace:\n";

    $e = new Exception();
    $trace = explode("\n", $e->getTraceAsString());
    // reverse array to make steps line up chronologically
    $trace = array_reverse($trace);
    array_shift($trace); // remove {main}
    array_pop($trace); // remove call to this method
    $length = count($trace);
    $result = [];

    for ($i = 0; $i < $length; $i++)
    {
        $result[] = ($i + 1)  . '.' . substr($trace[$i], strpos($trace[$i], ' '));
    }

    print implode("\n", $result);
    print "\n\n";
}
