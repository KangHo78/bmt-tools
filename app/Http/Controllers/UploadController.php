<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function __invoke(Request $request)
    {
        $request->validate(['file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120']]);
        $path = $request->file('file')->store('evidence', 'public');

        return response()->json(['path' => $path, 'url' => asset('storage/'.$path)]);
    }
}
