<?php
$minZ = 21;
$maxZ = -1;
if ($handle = opendir('./tiles')) {
    while (false !== ($entry = readdir($handle))) {
        $z = intval($entry);
		if ( $z > 0 ) {
			if ( $z < $minZ )
				$minZ = $z;
			if ( $z > $maxZ )
				$maxZ = $z;
		}
    }
    closedir($handle);
	echo $minZ.",".$maxZ;
}
?>
