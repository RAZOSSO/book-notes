import { HashRouter, Route, Routes } from "react-router-dom";
import { LibraryProvider } from "./store/LibraryContext";
import { ShelfPage } from "./pages/ShelfPage";
import { BookFormPage } from "./pages/BookFormPage";
import { BookDetailPage } from "./pages/BookDetailPage";
import { SearchPage } from "./pages/SearchPage";
import { SettingsPage } from "./pages/SettingsPage";

function App() {
  return (
    <LibraryProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<ShelfPage />} />
          <Route path="/books/new" element={<BookFormPage />} />
          <Route path="/books/:bookId" element={<BookDetailPage />} />
          <Route path="/books/:bookId/edit" element={<BookFormPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </HashRouter>
    </LibraryProvider>
  );
}

export default App;
